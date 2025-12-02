"use server"

import normalizeErrors from "@/helpers/normalizeErrors"
import { registerSchema, successSchema } from "@/schemas"

type errorsType = {
    errors: string[],
    success: string,
}

export async function register(prevState: errorsType, formData: FormData) {

    const registerData = {
        nombre: formData.get("nombre"),
        email: formData.get("email"),
        password: formData.get("password"),
        password2: formData.get("password2"),
    }

    const register = registerSchema.safeParse(registerData)

    if (!register.success) {
        const errors = register.error.issues.map(error => error.message)
        return {
            errors,
            success: '',
        }
    }

    const url = `${process.env.API_URL}/users/register`

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nombre: register.data.nombre,
            email: register.data.email,
            password: register.data.password,
        }),
    })

    const json = await res.json()

    if (!res.ok) {
        return {
            ...normalizeErrors(json),
            success: '',
        }
    }
    console.log(json);

    const { message } = successSchema.parse(json)

    return {
        errors: [],
        success: message,
    }
}