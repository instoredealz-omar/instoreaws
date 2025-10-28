import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  methodOrOptions: string | { method: string; body?: unknown },
  body?: unknown
): Promise<Response> {
  let method: string;
  let requestBody: unknown;

  if (typeof methodOrOptions === 'string') {
    method = methodOrOptions;
    requestBody = body;
  } else {
    method = methodOrOptions.method;
    requestBody = methodOrOptions.body;
  }

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  
  if (requestBody) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    if (!token.startsWith('eyJ')) {
      localStorage.removeItem('auth_token');
      throw new Error('401: Authentication expired. Please log out and log back in.');
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
