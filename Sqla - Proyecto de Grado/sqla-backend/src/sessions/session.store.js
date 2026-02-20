import { v4 as uuid } from "uuid";

const sessions = new Map();

export function createSession() {
    const id = uuid();

    sessions.set(id, {
        schema: {
            tables: {},
            relations: []
        },
        queries: [],
        createdAt: new Date()
    });

    return id;
}

export function getSession(id) {
    return sessions.get(id);
}

export function saveSchema(sessionId, schema) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    session.schema = schema;
    return session;
}

export function addQuery(sessionId, query) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    session.queries.push(query);
    return session;
}

export function updateSession(sessionId, newData) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    sessions.set(sessionId, {
        ...session,
        ...newData
    });

    return sessions.get(sessionId);
}
export function createSessionWithId(id) {
    sessions.set(id, {
        schema: {
            tables: {},
            relations: []
        },
        queries: [],
        createdAt: new Date()
    });
    return id;
}