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

const numericIntFieldSchema = z.coerce.number().int()

const optionalTrimmedString = (max: number) =>
        z.preprocess((value) => {
                if (typeof value !== "string") return value
                const trimmed = value.trim()
                return trimmed === "" ? undefined : trimmed
        }, z.string().max(max).optional())

const optionalEmailString = z.preprocess((value) => {
        if (typeof value !== "string") return value
        const trimmed = value.trim()
        return trimmed === "" ? undefined : trimmed
}, z.string().email({ message: "E-mail no valido" }).max(255).optional())

const optionalPhoneString = z.preprocess((value) => {
        if (typeof value !== "string") return value
        const trimmed = value.trim()
        return trimmed === "" ? undefined : trimmed
}, z
        .string()
        .regex(/^\d{7,15}$/, {
                message: "El telefono debe tener entre 7 y 15 digitos",
        })
        .optional())

const requiredTrimmedString = (label: string, max: number) =>
        z.string()
                .trim()
                .min(1, { message: `El ${label} es obligatorio` })
                .max(max, {
                        message: `El ${label} no puede exceder ${max} caracteres`,
                })

const nullableOptionalStringSchema = z.string().nullable().optional()

export const doctorSchema = z.object({
        id: numericIntFieldSchema,
        firstName: z.string(),
        lastName: z.string(),
        middleName: nullableOptionalStringSchema,
        email: nullableOptionalStringSchema,
        phone: nullableOptionalStringSchema,
        specialty: nullableOptionalStringSchema,
        licenseNumber: nullableOptionalStringSchema,
        notes: nullableOptionalStringSchema,
        isActive: z.boolean().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
})

export const createDoctorPayloadSchema = z.object({
        firstName: requiredTrimmedString("nombre", 150),
        lastName: requiredTrimmedString("apellido paterno", 150),
        middleName: optionalTrimmedString(150),
        email: optionalEmailString,
        phone: optionalPhoneString,
        specialty: optionalTrimmedString(150),
        licenseNumber: optionalTrimmedString(50),
        notes: optionalTrimmedString(2000),
})

export const updateDoctorPayloadSchema = createDoctorPayloadSchema.partial()

export const updateDoctorStatusPayloadSchema = z.object({
        isActive: z.boolean(),
})

export const doctorsSearchResponseSchema = z.object({
        data: z.array(doctorSchema),
        meta: z.object({
                page: numericIntFieldSchema,
                limit: numericIntFieldSchema,
                total: numericIntFieldSchema,
        }),
})

export const doctorMutationResponseSchema = z.object({
        message: z.string(),
        data: doctorSchema,
})

export const doctorMessageResponseSchema = z.object({
        message: z.string(),
})

export type Doctor = z.infer<typeof doctorSchema>
export type CreateDoctorPayload = z.infer<typeof createDoctorPayloadSchema>
export type UpdateDoctorPayload = z.infer<typeof updateDoctorPayloadSchema>
export type UpdateDoctorStatusPayload = z.infer<typeof updateDoctorStatusPayloadSchema>
export type DoctorsSearchResponse = z.infer<typeof doctorsSearchResponseSchema>
export type DoctorMutationResponse = z.infer<typeof doctorMutationResponseSchema>

const patientGenderSchema = z.enum(["male", "female", "other"])

const birthDateStringSchema = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
                message: "La fecha de nacimiento debe tener formato YYYY-MM-DD",
        })
        .refine((value) => {
                const parsed = new Date(`${value}T00:00:00`)
                if (Number.isNaN(parsed.getTime())) return false

                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return parsed <= today
        }, {
                message: "La fecha de nacimiento no puede ser futura",
        })

export const patientSchema = z.object({
        id: numericIntFieldSchema,
        firstName: z.string(),
        lastName: z.string(),
        middleName: nullableOptionalStringSchema,
        gender: patientGenderSchema,
        birthDate: z.string(),
        phone: nullableOptionalStringSchema,
        email: nullableOptionalStringSchema,
        addressLine: nullableOptionalStringSchema,
        addressBetween: nullableOptionalStringSchema,
        addressCity: nullableOptionalStringSchema,
        addressState: nullableOptionalStringSchema,
        addressZip: nullableOptionalStringSchema,
        documentType: nullableOptionalStringSchema,
        documentNumber: nullableOptionalStringSchema,
        isActive: z.boolean().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
})

export const createPatientPayloadSchema = z.object({
        firstName: requiredTrimmedString("nombre", 150),
        lastName: requiredTrimmedString("apellido paterno", 150),
        middleName: optionalTrimmedString(150),
        gender: patientGenderSchema,
        birthDate: birthDateStringSchema,
        phone: optionalPhoneString,
        email: optionalEmailString,
        addressLine: optionalTrimmedString(255),
        addressBetween: optionalTrimmedString(255),
        addressCity: optionalTrimmedString(150),
        addressState: optionalTrimmedString(150),
        addressZip: z.preprocess((value) => {
                if (typeof value !== "string") return value
                const trimmed = value.trim()
                return trimmed === "" ? undefined : trimmed
        }, z.string().regex(/^\d{4,10}$/, {
                message: "El codigo postal debe contener solo numeros",
        }).optional()),
        documentType: optionalTrimmedString(100),
        documentNumber: optionalTrimmedString(100),
}).superRefine((patient, ctx) => {
        if (patient.documentType && !patient.documentNumber) {
                ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Captura el numero del documento",
                        path: ["documentNumber"],
                })
        }

        if (!patient.documentType && patient.documentNumber) {
                ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Indica el tipo de documento",
                        path: ["documentType"],
                })
        }
})

export const updatePatientPayloadSchema = createPatientPayloadSchema.partial()

export const updatePatientStatusPayloadSchema = z.object({
        isActive: z.boolean(),
})

export const patientsSearchResponseSchema = z.object({
        data: z.array(patientSchema),
        meta: z.object({
                page: numericIntFieldSchema,
                limit: numericIntFieldSchema,
                total: numericIntFieldSchema,
        }),
})

export const patientMutationResponseSchema = z.object({
        message: z.string(),
        data: patientSchema,
})

export const patientMessageResponseSchema = z.object({
        message: z.string(),
})

export type Patient = z.infer<typeof patientSchema>
export type CreatePatientPayload = z.infer<typeof createPatientPayloadSchema>
export type UpdatePatientPayload = z.infer<typeof updatePatientPayloadSchema>
export type UpdatePatientStatusPayload = z.infer<typeof updatePatientStatusPayloadSchema>
export type PatientsSearchResponse = z.infer<typeof patientsSearchResponseSchema>
export type PatientMutationResponse = z.infer<typeof patientMutationResponseSchema>
