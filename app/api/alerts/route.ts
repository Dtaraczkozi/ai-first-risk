import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/data/store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const severity = searchParams.get('severity');
  
  let alerts = dataStore.getAlerts();
  
  if (status === 'active') {
    alerts = alerts.filter(a => !a.acknowledgedAt);
  } else if (status === 'acknowledged') {
    alerts = alerts.filter(a => a.acknowledgedAt);
  }
  
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity);
  }
  
  return NextResponse.json({
    alerts,
    count: alerts.length,
    activeCount: alerts.filter(a => !a.acknowledgedAt).length,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }
    
    if (action === 'acknowledge') {
      const result = dataStore.acknowledgeAlert(alertId);
      if (!result) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ alert: result });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
