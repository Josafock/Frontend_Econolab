import { z } from "zod";

const roleSchema = z.enum(["admin", "recepcionista", "unassigned"]);

const rawUserSchema = z
        .object({
                sub: z.union([z.string(), z.number()]).optional(),
                id: z.union([z.string(), z.number()]).optional(),
                nombre: z.string(),
                email: z.string().email(),
                rol: roleSchema.optional(),
                role: roleSchema.optional(),
        })
        .superRefine((user, ctx) => {
                if (!user.sub && !user.id) {
                        ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: "El usuario no incluye un identificador valido",
                                path: ["sub"],
                        });
                }

                if (!user.rol && !user.role) {
                        ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: "El usuario no incluye un rol valido",
                                path: ["rol"],
                        });
                }
        });

export const userSchema = rawUserSchema.transform((u) => ({
        id: String(u.sub ?? u.id ?? ""),
        sub: String(u.sub ?? u.id ?? ""),
        nombre: u.nombre,
        email: u.email,
        rol: u.rol ?? u.role ?? "unassigned",
}));

export type User = z.infer<typeof userSchema>

export const loginSchema = z.object({
        email: z.string()
                .min(1, { message: "El email es obligatorio" })
                .email({ message: "E-mail no válido" }),
        password: z.string()
                .min(8, { message: "La contraseña es obligatoria" }),
})

export const registerSchema = z.object({
        nombre: z.string()
                .min(1, { message: "El nombre es obligatorio" }),

        email: z.string()
                .min(1, { message: "El email es obligatorio" })
                .email({ message: "E-mail no válido" }),

        password: z.string()
                .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
                .regex(/[A-Z]/, {
                        message: "La contraseña debe incluir al menos una letra mayúscula",
                })
                .regex(/[a-z]/, {
                        message: "La contraseña debe incluir al menos una letra minúscula",
                })
                .regex(/[0-9]/, {
                        message: "La contraseña debe incluir al menos un número",
                })
                .regex(/[^A-Za-z0-9]/, {
                        message: "La contraseña debe incluir al menos un carácter especial",
                }),

        password2: z.string(),
})
        .refine((data) => data.password === data.password2, {
                message: "Las contraseñas no coinciden",
                path: ["password2"],
        });


export const TokenSchema = z.string({ message: "El token no es válido" })
        .length(6, { message: "El token debe tener 6 caracteres" })

export const forgotPasswordSchema = z.object({
        email: z.string()
                .min(1, { message: "El email es obligatorio" })
                .email({ message: "E-mail no válido" })
})

export const resetPassSchema = z.object({
        password: z.string()
                .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
                .regex(/[A-Z]/, {
                        message: "La contraseña debe incluir al menos una letra mayúscula",
                })
                .regex(/[a-z]/, {
                        message: "La contraseña debe incluir al menos una letra minúscula",
                })
                .regex(/[0-9]/, {
                        message: "La contraseña debe incluir al menos un número",
                })
                .regex(/[^A-Za-z0-9]/, {
                        message: "La contraseña debe incluir al menos un carácter especial",
                }),
        confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
})

export const successSchema = z.object({
        message: z.string(),
})
