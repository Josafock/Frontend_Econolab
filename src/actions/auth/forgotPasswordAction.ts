"use server"

import normalizeErrors from "@/helpers/normalizeErrors";
import { forgotPasswordSchema, successSchema } from "@/schemas";

type forgotPasswordType = {
    errors: string[];
    success: string;
}

export async function forgotPassword(orevState: forgotPasswordType, formData: FormData) {

    const forgotPass = forgotPasswordSchema.safeParse({
        email: formData.get('email')
    });

    if (!forgotPass.success) {
        return {
            errors: forgotPass.error.issues.map(error => error.message),
            success: ''
        };
    }

    const url = `${process.env.API_URL}/users/forgot-password`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: forgotPass.data.email
        })
    })

    const json = await res.json();

    console.log(json);

    if (!res.ok) {
            return {
                ...normalizeErrors(json),
                success: '',
            }
        }

    const { message } = successSchema.parse(json);

    return {
        errors: [],
        success: message
    }
}