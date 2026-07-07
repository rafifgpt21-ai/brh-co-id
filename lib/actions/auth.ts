"use server"

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginActionState = {
  success?: boolean;
  error?: string;
  type?: string;
} | null;

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  try {
    await signIn("credentials", formData);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Extract specific error message if possible
      // In NextAuth v5, custom errors in authorize often end up as CredentialsSignin 
      // or CallbackRouteError with the message in 'cause'
      const errorMessage = error.cause?.err?.message || "Kredensial tidak valid.";
      
      return { 
        success: false, 
        error: errorMessage,
        type: error.type 
      };
    }
    
    // AuthError redirects are thrown as errors but should be ignored
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return { 
      success: false, 
      error: "Terjadi kesalahan internal. Silakan coba lagi nanti." 
    };
  }
}
