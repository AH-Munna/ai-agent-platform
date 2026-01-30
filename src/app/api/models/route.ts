import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const baseUrl = searchParams.get("baseUrl") || "https://integrate.api.nvidia.com/v1";
    const apiKey = searchParams.get("apiKey") || "";

    if (!apiKey) {
        return NextResponse.json(
            { error: "API key is required" },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(`${baseUrl}/models`, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Failed to fetch models: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to fetch models" },
            { status: 500 }
        );
    }
}
