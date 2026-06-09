import { createAuthClient } from "better-auth/react";
import { webEnv } from "@/env/web";
import { BASE_PATH } from "@/site/brand";

export const { signIn, signUp, useSession } = createAuthClient({
	// Mirror the server: endpoints live under the /app basePath.
	baseURL: `${webEnv.NEXT_PUBLIC_SITE_URL}${BASE_PATH}`,
});
