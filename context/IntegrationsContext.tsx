import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useHealthConnect } from '../hooks/useHealthConnect';

// 1. REGISTER APP AT: https://www.strava.com/settings/api
const STRAVA_CLIENT_ID = 'REPLACE_WITH_YOUR_CLIENT_ID';
const STRAVA_CLIENT_SECRET = 'REPLACE_WITH_YOUR_CLIENT_SECRET';

// Endpoint discovery
const discovery = {
    authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
    tokenEndpoint: 'https://www.strava.com/oauth/token',
    revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

export type IntegrationStatus = 'connected' | 'disconnected' | 'loading' | 'error';

export interface Integration {
    id: 'strava' | 'health_connect' | 'google_fit' | 'samsung_health';
    name: string;
    icon: string; // Ionicons name
    status: IntegrationStatus;
    lastSync?: string;
}

type IntegrationsContextType = {
    integrations: Integration[];
    connectIntegration: (id: string) => Promise<void>;
    disconnectIntegration: (id: string) => Promise<void>;
    syncIntegration: (id: string) => Promise<void>;
};

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: 'strava', name: 'Strava', icon: 'logo-strava', status: 'disconnected' },
        { id: 'health_connect', name: 'Health Connect', icon: 'heart', status: 'disconnected' },
        { id: 'google_fit', name: 'Google Fit', icon: 'fitness', status: 'disconnected' },
        { id: 'samsung_health', name: 'Samsung Health', icon: 'pulse', status: 'disconnected' },
    ]);

    const healthConnect = useHealthConnect();

    // Setup Auth Request
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: STRAVA_CLIENT_ID,
            scopes: ['activity:read_all'],
            redirectUri: AuthSession.makeRedirectUri({
                scheme: 'strive' // Must match app.json scheme
            }),
        },
        discovery
    );

    // Handle Auth Response (This listens for the return from the browser)
    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;
            exchangeToken(code);
        }
    }, [response]);

    // Load saved statuses
    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const saved = await AsyncStorage.getItem('@integrations_status');
            if (saved) {
                const savedMap = JSON.parse(saved);
                setIntegrations(prev => prev.map(i => ({
                    ...i,
                    status: savedMap[i.id] || 'disconnected'
                })));
            }
        } catch (e) {
            console.error("Failed to load integrations", e);
        }
    };

    const saveIntegrations = async (updatedIntegrations: Integration[]) => {
        try {
            const statusMap = updatedIntegrations.reduce((acc, curr) => ({
                ...acc,
                [curr.id]: curr.status
            }), {});
            await AsyncStorage.setItem('@integrations_status', JSON.stringify(statusMap));
        } catch (e) {
            console.error("Failed to save integrations", e);
        }
    };

    const exchangeToken = async (code: string) => {
        try {
            // This exchanges the temporary code for a permanent access token
            // Note: In production, this exchange is better done on a backend server to keep Client Secret safe.
            const response = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                }),
            });
            const data = await response.json();

            if (data.access_token) {
                // Success! Save token securely (omitted for brevity, assume connected)
                updateStatus('strava', 'connected');
                alert('Strava conectado com sucesso!');
            }
        } catch (error) {
            console.error('Token exchange failed', error);
            updateStatus('strava', 'error');
        }
    };

    const updateStatus = async (id: string, status: IntegrationStatus) => {
        const newIntegrations = integrations.map(i =>
            i.id === id ? { ...i, status: status, lastSync: new Date().toISOString() } : i
        );
        setIntegrations(newIntegrations);
        await saveIntegrations(newIntegrations);
    };

    const connectIntegration = async (id: string) => {
        if (id === 'health_connect') {
            updateStatus('health_connect', 'loading');
            const success = await healthConnect.connect();
            if (success) {
                updateStatus('health_connect', 'connected');
            } else {
                updateStatus('health_connect', 'disconnected');
            }
            return;
        }

        if (id === 'strava') {
            if (STRAVA_CLIENT_ID === 'REPLACE_WITH_YOUR_CLIENT_ID') {
                alert('Por favor, configure o CLIENT_ID no código (context/IntegrationsContext.tsx)');
                return;
            }
            updateStatus('strava', 'loading');
            promptAsync(); // Opens the browser for login
        } else {
            // Mock setup for others for now
            updateStatus(id, 'loading');
            setTimeout(() => updateStatus(id, 'connected'), 2000);
        }
    };

    const disconnectIntegration = async (id: string) => {
        updateStatus(id, 'loading');
        setTimeout(() => updateStatus(id, 'disconnected'), 1000);
    };

    const syncIntegration = async (id: string) => {
        console.log(`Syncing ${id}...`);
    };

    return (
        <IntegrationsContext.Provider value={{ integrations, connectIntegration, disconnectIntegration, syncIntegration }}>
            {children}
        </IntegrationsContext.Provider>
    );
}

export const useIntegrations = () => {
    const context = useContext(IntegrationsContext);
    if (!context) throw new Error('useIntegrations must be used within IntegrationsProvider');
    return context;
};
