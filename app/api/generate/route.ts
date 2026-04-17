import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const pythonResponse = await fetch(`${API_BASE_URL}/predict-career`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();
        if (pythonResponse.status === 422) {
            console.log("FastAPI Validation Error:", data.detail);
            return NextResponse.json({
                success: false,
                error: "Data format mismatch with Python backend."
            }, { status: 422 });
        }

        if (data.success) {
            return NextResponse.json(data, {
                status: 200
            });
        } else {
            return NextResponse.json({
                success: false, 
                error: data.error
            }, {
                status: 400
            });
        }
    } catch(error) {
        console.log("Microservice Connection Error : ", error);
        return NextResponse.json({
            success: false, 
            error: "Failed to connect to Python Brain. Is Port 8000 running ?"
        }, {
            status: 500
        });
    }
}