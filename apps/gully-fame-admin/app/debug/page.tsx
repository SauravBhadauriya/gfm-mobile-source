"use client";

import { useState } from "react";

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://103.194.228.68:3552/v1/api/";
    const endpoint = `${apiUrl}admin/login`;

    try {
      console.log("Testing API endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: "admin@gullyfame.com",
          password: "admin123",
          role: "ADMIN",
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
        success: response.ok,
      });
    } catch (error: any) {
      setResult({
        error: error.message,
        type: error.name,
        stack: error.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API Debug</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <p className="text-gray-300 mb-4">
            API URL:{" "}
            <code className="bg-gray-900 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_API_BASE_URL}
            </code>
          </p>

          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            {loading ? "Testing..." : "Test Login API"}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Response:</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
