import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Debug() {
    const [status, setStatus] = useState('Checking...');
    const [logs, setLogs] = useState([]);
    const [tables, setTables] = useState({});

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    useEffect(() => {
        checkSystem();
    }, []);

    const checkSystem = async () => {
        addLog('Starting system check...');

        // 1. Check Connection & Profiles Table
        try {
            addLog('Checking "profiles" table...');
            const { data, error } = await supabase.from('profiles').select('id, full_name, email, role').limit(5);
            if (error) {
                addLog(`Error accessing profiles: ${error.message} (${error.code})`);
                setTables(prev => ({ ...prev, profiles: 'Error' }));
            } else {
                addLog(`Profiles table accessible. Found ${data?.length ?? 0} rows.`);
                if (data && data.length > 0) {
                    const sample = data[0];
                    addLog(`Sample Profile: Name="${sample.full_name}", Email="${sample.email || '(MISSING)'}"`);
                    if (sample.email === undefined) {
                        addLog('WARNING: "email" column does not exist in profiles table!');
                    }
                }
                setTables(prev => ({ ...prev, profiles: 'OK' }));
            }
        } catch (e) {
            addLog(`Exception checking profiles: ${e.message}`);
        }

        // 2. Check Auth Service (Ping)
        try {
            addLog('Checking Auth Service...');
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                addLog(`Auth Error: ${error.message}`);
            } else {
                addLog(`Auth Service responding. Session: ${data.session ? 'Active' : 'None'}`);
            }
        } catch (e) {
            addLog(`Auth Exception: ${e.message}`);
        }

        // 3. Check Contents Table
        try {
            addLog('Checking "contents" table...');
            const { error } = await supabase.from('contents').select('id').limit(1);
            if (error) {
                addLog(`Error accessing contents: ${error.message}`);
                setTables(prev => ({ ...prev, contents: 'Error' }));
            } else {
                addLog('Contents table accessible.');
                setTables(prev => ({ ...prev, contents: 'OK' }));
            }
        } catch (e) {
            addLog(`Exception checking contents: ${e.message}`);
        }

        setStatus('Check Complete');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">System Debugger</h1>

            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-semibold mb-2">Table Status</h2>
                    <ul>
                        {Object.entries(tables).map(([table, status]) => (
                            <li key={table} className="flex justify-between">
                                <span>{table}:</span>
                                <span className={status === 'OK' ? 'text-green-600' : 'text-red-600 font-bold'}>{status}</span>
                            </li>
                        ))}
                        {Object.keys(tables).length === 0 && <li>Checking database...</li>}
                    </ul>
                </div>
            </div>

            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto mb-6">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            <div className="p-4 border rounded bg-blue-50">
                <h2 className="font-semibold mb-2">Test Name Lookup</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="testName"
                        placeholder="Enter Full Name (e.g., Jssu sjsj)"
                        className="border p-2 rounded flex-grow"
                    />
                    <button
                        onClick={async () => {
                            const name = document.getElementById('testName').value.trim();
                            addLog(`Searching for name: "${name}"...`);
                            try {
                                const { data, error } = await supabase
                                    .from('profiles')
                                    .select('email, full_name')
                                    .eq('full_name', name)
                                    .single();

                                if (error) {
                                    addLog(`Lookup Error: ${error.message} (${error.code})`);
                                } else {
                                    addLog(`Found! Name: ${data.full_name}, Email: ${data.email}`);
                                }
                            } catch (e) {
                                addLog(`Lookup Exception: ${e.message}`);
                            }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
                <p>If tables show "Error", it means the database schema has not been initialized correctly.</p>
                <p>Please run the SQL scripts in the Supabase SQL Editor.</p>
            </div>
        </div>
    );
}
