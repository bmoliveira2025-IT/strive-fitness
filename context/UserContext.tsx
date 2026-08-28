import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
    userName: string;
    setUserName: (name: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userName, setUserNameState] = useState('Atleta');

    useEffect(() => {
        loadUserName();
    }, []);

    const loadUserName = async () => {
        try {
            const storedName = await AsyncStorage.getItem('user_name');
            if (storedName) {
                setUserNameState(storedName);
            }
        } catch (error) {
            console.error('Failed to load user name', error);
        }
    };

    const setUserName = async (name: string) => {
        try {
            setUserNameState(name);
            await AsyncStorage.setItem('user_name', name);
        } catch (error) {
            console.error('Failed to save user name', error);
        }
    };

    return (
        <UserContext.Provider value={{ userName, setUserName }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserStore() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
