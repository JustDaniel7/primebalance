import { NextResponse } from 'next/server';

export async function GET() {
    // Return stub data for the investor dashboard
    return NextResponse.json({
        metrics: {
            totalInvestors: 0,
            totalRaised: 0,
            activeInvestors: 0,
            averageInvestment: 0,
        },
        runway: {
            months: 0,
            burnRate: 0,
            cashOnHand: 0,
        },
        recentActivity: [],
        boardSummary: null,
    });
}
