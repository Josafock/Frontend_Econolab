use base64::Engine;
use serde::Serialize;
use std::{
  collections::HashMap,
  fs,
  io::Write,
  net::{SocketAddr, TcpStream},
  path::{Path, PathBuf},
  process::{Child, Command, Stdio},
  sync::Mutex,
  time::Duration,
};
use tauri::{AppHandle, Manager, RunEvent};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const BACKEND_PORT: u16 = 3000;
const DEFAULT_SYNC_REMOTE_BASE_URL: &str =
  "https://backend-econolab-9mtr.onrender.com/api";
const DEFAULT_SYNC_MACHINE_TOKEN: &str = "econolab-sync-secret";
const DEFAULT_SYNC_AUTO_ENABLED: &str = "true";
const DEFAULT_SYNC_AUTO_INTERVAL_SECONDS: &str = "10";

#[derive(Default)]
struct BackendProcessState(Mutex<Option<Child>>);

#[derive(Serialize)]
struct DesktopFileResult {
  path: Option<String>,
}

#[cfg(target_os = "windows")]
fn normalize_process_path(path: PathBuf) -> PathBuf {
  let raw = path.to_string_lossy();
  if let Some(stripped) = raw.strip_prefix(r"\\?\") {
    return PathBuf::from(stripped);
  }

  PathBuf::from(raw.as_ref())
}

#[cfg(not(target_os = "windows"))]
fn normalize_process_path(path: PathBuf) -> PathBuf {
  path
}

fn app_store_path(app: &AppHandle) -> Result<PathBuf, String> {
  let mut directory = app
    .path()
    .app_data_dir()
    .map_err(|error| format!("No se pudo resolver el directorio de la app: {error}"))?;
  fs::create_dir_all(&directory)
    .map_err(|error| format!("No se pudo crear el directorio de datos: {error}"))?;
  directory.push("desktop-store.json");
  Ok(directory)
}

fn read_store(app: &AppHandle) -> Result<HashMap<String, String>, String> {
  let path = app_store_path(app)?;

  if !path.exists() {
    return Ok(HashMap::new());
  }

  let content = fs::read_to_string(&path)
    .map_err(|error| format!("No se pudo leer el store local: {error}"))?;
  let content = content.trim_start_matches('\u{feff}');

  if content.trim().is_empty() {
    return Ok(HashMap::new());
  }

  serde_json::from_str(&content)
    .map_err(|error| format!("No se pudo parsear el store local: {error}"))
}

fn write_store(app: &AppHandle, values: &HashMap<String, String>) -> Result<(), String> {
  let path = app_store_path(app)?;
  let content = serde_json::to_string_pretty(values)
    .map_err(|error| format!("No se pudo serializar el store local: {error}"))?;

  fs::write(&path, content)
    .map_err(|error| format!("No se pudo escribir el store local: {error}"))
}

fn ensure_default_store(app: &AppHandle) -> Result<(), String> {
  let mut store = read_store(app)?;
  let mut changed = false;

  let defaults = [
    ("sync.remoteBaseUrl", DEFAULT_SYNC_REMOTE_BASE_URL),
    ("sync.machineToken", DEFAULT_SYNC_MACHINE_TOKEN),
    ("sync.autoEnabled", DEFAULT_SYNC_AUTO_ENABLED),
    ("sync.autoIntervalSeconds", DEFAULT_SYNC_AUTO_INTERVAL_SECONDS),
  ];

  for (key, value) in defaults {
    let is_missing = store
      .get(key)
      .map(|current| current.trim().is_empty())
      .unwrap_or(true);

    if is_missing {
      store.insert(key.to_string(), value.to_string());
      changed = true;
    }
  }

  if changed {
    write_store(app, &store)?;
  }

  Ok(())
}

fn desktop_artifacts_dir(app: &AppHandle) -> Result<PathBuf, String> {
  let mut directory = app
    .path()
    .download_dir()
    .or_else(|_| app.path().document_dir())
    .or_else(|_| app.path().app_data_dir())
    .map_err(|error| format!("No se pudo resolver el directorio de descarga: {error}"))?;
  directory.push("Econolab");
  fs::create_dir_all(&directory)
    .map_err(|error| format!("No se pudo crear el directorio de archivos: {error}"))?;
  Ok(directory)
}

fn sanitize_filename(value: &str) -> String {
  let fallback = "econolab-file.bin".to_string();
  let candidate = value.trim();

  if candidate.is_empty() {
    return fallback;
  }

  Path::new(candidate)
    .file_name()
    .and_then(|filename| filename.to_str())
    .map(|filename| {
      filename.replace(['<', '>', ':', '"', '/', '\\', '|', '?', '*'], "_")
    })
    .filter(|filename| !filename.trim().is_empty())
    .unwrap_or(fallback)
}

fn next_available_path(base_dir: &Path, filename: &str) -> PathBuf {
  let preferred = base_dir.join(filename);
  if !preferred.exists() {
    return preferred;
  }

  let stem = Path::new(filename)
    .file_stem()
    .and_then(|value| value.to_str())
    .unwrap_or("archivo");
  let extension = Path::new(filename)
    .extension()
    .and_then(|value| value.to_str())
    .unwrap_or("");

  for index in 1..=999 {
    let candidate_name = if extension.is_empty() {
      format!("{stem}-{index}")
    } else {
      format!("{stem}-{index}.{extension}")
    };
    let candidate = base_dir.join(candidate_name);
    if !candidate.exists() {
      return candidate;
    }
  }

  preferred
}

fn open_path(path: &Path) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    Command::new("cmd")
      .args(["/C", "start", "", &path.to_string_lossy()])
      .spawn()
      .map_err(|error| format!("No se pudo abrir el archivo guardado: {error}"))?;
    return Ok(());
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(path)
      .spawn()
      .map_err(|error| format!("No se pudo abrir el archivo guardado: {error}"))?;
    return Ok(());
  }

  #[cfg(all(unix, not(target_os = "macos")))]
  {
    Command::new("xdg-open")
      .arg(path)
      .spawn()
      .map_err(|error| format!("No se pudo abrir el archivo guardado: {error}"))?;
    return Ok(());
  }
}

fn backend_resource_root(app: &AppHandle) -> Result<PathBuf, String> {
  let resource_dir = app
    .path()
    .resource_dir()
    .map_err(|error| format!("No se pudo resolver resource_dir: {error}"))?;
  let candidates = [
    resource_dir.join("backend-runtime"),
    resource_dir.join("resources").join("backend-runtime"),
  ];

  for candidate in candidates {
    if candidate.exists() {
      return Ok(normalize_process_path(candidate));
    }
  }

  Ok(normalize_process_path(resource_dir.join("backend-runtime")))
}

fn backend_node_path(app: &AppHandle) -> Result<PathBuf, String> {
  let resource_dir = app
    .path()
    .resource_dir()
    .map_err(|error| format!("No se pudo resolver resource_dir: {error}"))?;
  let executable = if cfg!(target_os = "windows") {
    "node.exe"
  } else {
    "node"
  };

  let candidates = [
    resource_dir.join("node").join(executable),
    resource_dir.join("resources").join("node").join(executable),
  ];

  for candidate in candidates {
    if candidate.exists() {
      return Ok(normalize_process_path(candidate));
    }
  }

  Ok(normalize_process_path(resource_dir.join("node").join(executable)))
}

fn backend_data_root(app: &AppHandle) -> Result<PathBuf, String> {
  let mut directory = app
    .path()
    .app_data_dir()
    .map_err(|error| format!("No se pudo resolver app_data_dir: {error}"))?;
  directory.push("backend");
  fs::create_dir_all(&directory)
    .map_err(|error| format!("No se pudo crear el directorio del backend local: {error}"))?;
  Ok(directory)
}

fn append_backend_log(app: &AppHandle, message: &str) {
  let mut log_path = match app.path().app_data_dir() {
    Ok(path) => path,
    Err(_) => return,
  };

  if fs::create_dir_all(&log_path).is_err() {
    return;
  }

  log_path.push("backend-startup.log");

  if let Ok(mut file) = fs::OpenOptions::new()
    .create(true)
    .append(true)
    .open(log_path)
  {
    let _ = writeln!(file, "{message}");
  }
}

fn backend_runtime_log_path(app: &AppHandle, filename: &str) -> Option<PathBuf> {
  let mut directory = app.path().app_data_dir().ok()?;
  if fs::create_dir_all(&directory).is_err() {
    return None;
  }

  directory.push(filename);
  Some(directory)
}

fn is_backend_port_open() -> bool {
  let address = SocketAddr::from(([127, 0, 0, 1], BACKEND_PORT));
  TcpStream::connect_timeout(&address, Duration::from_millis(400)).is_ok()
}

fn wait_for_backend_port(timeout_ms: u64) -> bool {
  let started_at = std::time::Instant::now();

  while started_at.elapsed().as_millis() < timeout_ms as u128 {
    if is_backend_port_open() {
      return true;
    }

    std::thread::sleep(Duration::from_millis(500));
  }

  false
}

fn store_value(app: &AppHandle, key: &str) -> Option<String> {
  read_store(app).ok()?.get(key).cloned()
}

fn backend_env(app: &AppHandle, runtime_root: &Path) -> Result<HashMap<String, String>, String> {
  let data_root = backend_data_root(app)?;
  let storage_root = data_root.join("storage");
  fs::create_dir_all(&storage_root)
    .map_err(|error| format!("No se pudo crear el storage local: {error}"))?;

  let sqlite_path = data_root.join("econolab.sqlite");
  let logo_path = runtime_root.join("public").join("logoeco.png");

  let mut env = HashMap::from([
    ("APP_RUNTIME_MODE".to_string(), "desktop-offline".to_string()),
    ("HOST".to_string(), "127.0.0.1".to_string()),
    ("PORT".to_string(), BACKEND_PORT.to_string()),
    ("DATABASE_TYPE".to_string(), "sqlite".to_string()),
    (
      "DATABASE_SQLITE_PATH".to_string(),
      sqlite_path.to_string_lossy().to_string(),
    ),
    ("DATABASE_SYNCHRONIZE".to_string(), "false".to_string()),
    ("DATABASE_LOGGING".to_string(), "false".to_string()),
    ("APP_CORS_ENABLED".to_string(), "true".to_string()),
    (
      "APP_CORS_ORIGINS".to_string(),
      "http://tauri.localhost,https://tauri.localhost,http://localhost:5173".to_string(),
    ),
    ("APP_MAIL_ENABLED".to_string(), "false".to_string()),
    ("APP_GOOGLE_AUTH_ENABLED".to_string(), "false".to_string()),
    ("APP_GMAIL_OAUTH_ENABLED".to_string(), "false".to_string()),
    (
      "APP_STORAGE_ROOT".to_string(),
      storage_root.to_string_lossy().to_string(),
    ),
    (
      "APP_PROFILE_IMAGE_STORAGE_MODE".to_string(),
      "filesystem".to_string(),
    ),
    (
      "JWT_SECRET".to_string(),
      store_value(app, "desktop.auth.jwtSecret")
        .unwrap_or_else(|| "econolab-desktop-local-secret".to_string()),
    ),
  ]);

  if logo_path.exists() {
    env.insert(
      "LAB_LOGO_PATH".to_string(),
      logo_path.to_string_lossy().to_string(),
    );
  }

  if let Some(remote_base_url) = store_value(app, "sync.remoteBaseUrl") {
    env.insert("SYNC_REMOTE_BASE_URL".to_string(), remote_base_url);
  }

  if let Some(machine_token) = store_value(app, "sync.machineToken") {
    env.insert("SYNC_MACHINE_TOKEN".to_string(), machine_token);
  }

  if let Some(auto_enabled) = store_value(app, "sync.autoEnabled") {
    env.insert("SYNC_AUTO_ENABLED".to_string(), auto_enabled);
  }

  if let Some(auto_interval_seconds) = store_value(app, "sync.autoIntervalSeconds") {
    env.insert(
      "SYNC_AUTO_INTERVAL_SECONDS".to_string(),
      auto_interval_seconds,
    );
  }

  Ok(env)
}

fn configure_backend_command(command: &mut Command) {
  command.stdin(Stdio::null());

  if cfg!(debug_assertions) {
    command.stdout(Stdio::inherit()).stderr(Stdio::inherit());
  } else {
    command.stdout(Stdio::null()).stderr(Stdio::null());
  }

  #[cfg(target_os = "windows")]
  command.creation_flags(CREATE_NO_WINDOW);
}

fn prepare_backend_runtime(
  app: &AppHandle,
  node_path: &Path,
  runtime_root: &Path,
  env: &HashMap<String, String>,
) -> Result<(), String> {
  let prepare_script = runtime_root.join("dist").join("scripts").join("runtime-local-prepare.js");
  if !prepare_script.exists() {
    return Err(format!(
      "No se encontro el bootstrap del backend local en {}",
      prepare_script.to_string_lossy()
    ));
  }

  let mut command = Command::new(&node_path);
  command
    .arg("-e")
    .arg("require(process.env.ECONOLAB_ENTRY_SCRIPT);")
    .current_dir(runtime_root)
    .env("ECONOLAB_ENTRY_SCRIPT", prepare_script.to_string_lossy().to_string())
    .envs(env);
  configure_backend_command(&mut command);
  append_backend_log(
    app,
    &format!(
      "prepare_backend_runtime node={} script={}",
      node_path.to_string_lossy(),
      prepare_script.to_string_lossy()
    ),
  );

  let output = command
    .output()
    .map_err(|error| format!("No se pudo preparar la base local del backend: {error}"))?;

  if !output.status.success() {
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!(
      "El bootstrap del backend local fallo.\nstdout: {}\nstderr: {}",
      stdout.trim(),
      stderr.trim()
    ));
  }

  append_backend_log(app, "prepare_backend_runtime ok");

  Ok(())
}

fn start_packaged_backend(app: &AppHandle) -> Result<(), String> {
  if cfg!(debug_assertions) || is_backend_port_open() {
    append_backend_log(
      app,
      &format!(
        "start_packaged_backend skipped debug={} port_open={}",
        cfg!(debug_assertions),
        is_backend_port_open()
      ),
    );
    return Ok(());
  }

  let runtime_root = backend_resource_root(app)?;
  let node_path = backend_node_path(app)?;
  append_backend_log(
    app,
    &format!(
      "start_packaged_backend runtime_root={} node_path={}",
      runtime_root.to_string_lossy(),
      node_path.to_string_lossy()
    ),
  );

  if !runtime_root.exists() || !node_path.exists() {
    append_backend_log(app, "start_packaged_backend resources missing, skipping");
    return Ok(());
  }

  let env = backend_env(app, &runtime_root)?;
  append_backend_log(
    app,
    &format!(
      "start_packaged_backend sqlite={} storage={}",
      env.get("DATABASE_SQLITE_PATH").cloned().unwrap_or_default(),
      env.get("APP_STORAGE_ROOT").cloned().unwrap_or_default()
    ),
  );
  prepare_backend_runtime(app, &node_path, &runtime_root, &env)?;

  let server_script = runtime_root.join("dist").join("src").join("main.js");
  if !server_script.exists() {
    return Err(format!(
      "No se encontro el backend compilado en {}",
      server_script.to_string_lossy()
    ));
  }

  let mut command = Command::new(&node_path);
  command
    .arg("-e")
    .arg("const mod = require(process.env.ECONOLAB_ENTRY_SCRIPT); Promise.resolve(mod.bootstrap()).catch((error) => { console.error(error); process.exit(1); });")
    .current_dir(&runtime_root)
    .env("ECONOLAB_ENTRY_SCRIPT", server_script.to_string_lossy().to_string())
    .envs(&env);
  configure_backend_command(&mut command);
  if !cfg!(debug_assertions) {
    if let Some(stdout_path) = backend_runtime_log_path(app, "backend-runtime.stdout.log") {
      if let Ok(file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(stdout_path)
      {
        command.stdout(Stdio::from(file));
      }
    }

    if let Some(stderr_path) = backend_runtime_log_path(app, "backend-runtime.stderr.log") {
      if let Ok(file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(stderr_path)
      {
        command.stderr(Stdio::from(file));
      }
    }
  }
  append_backend_log(
    app,
    &format!(
      "start_packaged_backend spawning node={} script={}",
      node_path.to_string_lossy(),
      server_script.to_string_lossy()
    ),
  );

  let child = command
    .spawn()
    .map_err(|error| format!("No se pudo iniciar el backend local empaquetado: {error}"))?;

  let backend_state = app.state::<BackendProcessState>();
  if let Ok(mut slot) = backend_state.0.lock() {
    *slot = Some(child);
  }

  if !wait_for_backend_port(20000) {
    append_backend_log(app, "start_packaged_backend timeout waiting for port 3000");
    return Err(
      "El backend local se lanzo, pero no respondio a tiempo en el puerto 3000."
        .to_string(),
    );
  }

  append_backend_log(app, "start_packaged_backend ok");

  Ok(())
}

fn stop_packaged_backend(app: &AppHandle) {
  let backend_state = app.state::<BackendProcessState>();
  let child = backend_state
    .0
    .lock()
    .ok()
    .and_then(|mut slot| slot.take());

  if let Some(mut child) = child {
    let _ = child.kill();
    let _ = child.wait();
  }
}

fn set_desktop_window_icons(app: &AppHandle) {
  let icon = match tauri::image::Image::from_bytes(include_bytes!("../icons/128x128.png")) {
    Ok(icon) => icon,
    Err(error) => {
      append_backend_log(app, &format!("set_desktop_window_icons error: {error}"));
      return;
    }
  };

  for label in ["main", "splash"] {
    if let Some(window) = app.get_webview_window(label) {
      let _ = window.set_icon(icon.clone());
    }
  }
}

#[tauri::command]
fn desktop_store_get(app: AppHandle, key: String) -> Result<Option<String>, String> {
  let store = read_store(&app)?;
  Ok(store.get(&key).cloned())
}

#[tauri::command]
fn desktop_store_set(app: AppHandle, key: String, value: String) -> Result<bool, String> {
  let mut store = read_store(&app)?;
  store.insert(key, value);
  write_store(&app, &store)?;
  Ok(true)
}

#[tauri::command]
fn desktop_store_delete(app: AppHandle, key: String) -> Result<bool, String> {
  let mut store = read_store(&app)?;
  store.remove(&key);
  write_store(&app, &store)?;
  Ok(true)
}

#[tauri::command]
fn desktop_notify_app_ready(app: AppHandle) -> Result<bool, String> {
  if let Some(main_window) = app.get_webview_window("main") {
    main_window
      .show()
      .map_err(|error| format!("No se pudo mostrar la ventana principal: {error}"))?;
    let _ = main_window.set_focus();
  }

  if let Some(splash_window) = app.get_webview_window("splash") {
    let _ = splash_window.close();
  }

  Ok(true)
}

#[allow(non_snake_case)]
#[tauri::command]
fn desktop_save_file(
  app: AppHandle,
  filename: String,
  dataBase64: String,
  openAfterSave: bool,
  _contentType: Option<String>,
) -> Result<DesktopFileResult, String> {
  let output_dir = desktop_artifacts_dir(&app)?;
  let target_path = next_available_path(&output_dir, &sanitize_filename(&filename));
  let bytes = base64::engine::general_purpose::STANDARD
    .decode(dataBase64)
    .map_err(|error| format!("No se pudo decodificar el archivo: {error}"))?;

  fs::write(&target_path, bytes)
    .map_err(|error| format!("No se pudo guardar el archivo de escritorio: {error}"))?;

  if openAfterSave {
    open_path(&target_path)?;
  }

  Ok(DesktopFileResult {
    path: Some(target_path.to_string_lossy().to_string()),
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let app = tauri::Builder::default()
    .manage(BackendProcessState::default())
    .invoke_handler(tauri::generate_handler![
      desktop_notify_app_ready,
      desktop_save_file,
      desktop_store_get,
      desktop_store_set,
      desktop_store_delete
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      if let Err(error) = ensure_default_store(&app.handle()) {
        append_backend_log(&app.handle(), &format!("ensure_default_store error: {error}"));
      }

      set_desktop_window_icons(&app.handle());

      if let Err(error) = start_packaged_backend(&app.handle()) {
        append_backend_log(&app.handle(), &format!("start_packaged_backend error: {error}"));
        log::warn!("No se pudo iniciar el backend local empaquetado: {error}");
      }

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application");

  app.run(|app_handle, event| {
    if let RunEvent::Exit = event {
      stop_packaged_backend(app_handle);
    }
  });
}
