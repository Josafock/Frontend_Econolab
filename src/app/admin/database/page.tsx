"use client";

import { useEffect, useState } from "react";
import { getDbTopics, type DbTopic } from "@/actions/db-admin/dbAdminActions";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

type TopicStatus = "planned" | "partial" | "implemented";

const statusLabel: Record<TopicStatus, string> = {
  planned: "Planeado",
  partial: "Parcial",
  implemented: "Implementado",
};

const statusColor: Record<TopicStatus, string> = {
  planned: "bg-gray-100 text-gray-800 border-gray-300",
  partial: "bg-amber-100 text-amber-800 border-amber-300",
  implemented: "bg-green-100 text-green-800 border-green-300",
};

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [generatingBackup, setGeneratingBackup] = useState(false);
  const [moduleName, setModuleName] = useState("");
  const [checkedAt, setCheckedAt] = useState("");
  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [backupScope, setBackupScope] = useState<"database" | "table">("database");
  const [selectedTable, setSelectedTable] = useState("");
  const [backupFormat, setBackupFormat] = useState<"sql" | "csv">("sql");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getDbTopics();

      if (!response.ok) {
        toast.error(response.errors[0] ?? "No se pudo cargar el modulo de base de datos.");
        setTopics([]);
        setLoading(false);
        return;
      }

      setModuleName(response.data.module);
      setCheckedAt(response.data.checkedAt);
      setTopics(response.data.topics);
      setLoading(false);
    };

    void load();
  }, []);

  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true);
      const res = await fetch("/api/db-admin/tables", { method: "GET", cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(json?.errors) ? json.errors[0] : "No se pudieron cargar las tablas.";
        toast.error(msg);
        setTables([]);
        setLoadingTables(false);
        return;
      }

      const values = Array.isArray(json?.tables)
        ? json.tables
            .map((table: unknown) => {
              if (typeof table === "string") return table;
              if (table && typeof table === "object" && "qualifiedName" in table) {
                const q = (table as { qualifiedName?: unknown }).qualifiedName;
                return typeof q === "string" ? q : "";
              }
              return "";
            })
            .filter((value: string) => value.length > 0)
        : [];

      setTables(values);
      setLoadingTables(false);
    };

    void loadTables();
  }, []);

  const handleGenerateBackup = async () => {
    if (backupScope === "table" && !selectedTable) {
      toast.error("Selecciona una tabla para respaldar.");
      return;
    }

    setGeneratingBackup(true);
    const payload =
      backupScope === "table"
        ? { scope: "table", tableName: selectedTable, format: backupFormat }
        : { scope: "database", format: "sql" };

    const response = await fetch("/api/db-admin/backups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const message = Array.isArray(json?.errors) ? json.errors[0] : "No se pudo generar el respaldo.";
      toast.error(message);
      setGeneratingBackup(false);
      return;
    }

    const disposition = response.headers.get("content-disposition") ?? "";
    const nameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const fileName = nameMatch?.[1] ?? `backup_${new Date().getTime()}.${backupFormat}`;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("Respaldo generado correctamente.");
    setGeneratingBackup(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Modulo de Base de Datos</h1>
        <p className="text-sm text-gray-600 mt-2">
          {moduleName || "Administracion de Base de Datos"}
        </p>
        {checkedAt ? (
          <p className="text-xs text-gray-500 mt-1">
            Ultima revision: {new Date(checkedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backups</h2>
            <p className="text-sm text-gray-600 mt-1">
              Genera respaldos por tabla o de toda la base de datos (esquemas operativo/public).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Alcance</label>
            <select
              value={backupScope}
              onChange={(e) => setBackupScope(e.target.value as "database" | "table")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="database">Toda la base de datos</option>
              <option value="table">Tabla especifica</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Tabla</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={backupScope !== "table" || loadingTables}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100"
            >
              <option value="">{loadingTables ? "Cargando tablas..." : "Selecciona una tabla"}</option>
              {tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Formato</label>
            <select
              value={backupFormat}
              onChange={(e) => setBackupFormat(e.target.value as "sql" | "csv")}
              disabled={backupScope !== "table"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100"
            >
              <option value="sql">SQL</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleGenerateBackup}
              disabled={generatingBackup || loadingTables}
              className="w-full rounded-lg border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
            >
              {generatingBackup ? "Generando..." : "Generar respaldo"}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm flex items-center justify-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando temas del modulo...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <section key={topic.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{topic.title}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor[
                    topic.status as TopicStatus
                  ]}`}
                >
                  {statusLabel[topic.status as TopicStatus]}
                </span>
              </div>

              <p className="text-sm text-gray-700 mt-3">{topic.summary}</p>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Implementado</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {topic.implemented.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Pendiente</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                  {topic.pending.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {topic.recommendation ? (
                <p className="mt-4 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-3">
                  Recomendacion: {topic.recommendation}
                </p>
              ) : null}

              {topic.data ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Datos tecnicos</h3>
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-md p-3 overflow-auto">
                    {JSON.stringify(topic.data, null, 2)}
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
