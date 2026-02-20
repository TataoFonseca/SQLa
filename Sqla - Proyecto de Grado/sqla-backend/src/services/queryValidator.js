const validateQuery = (query) => {
    if (!query) {
        return { ok: false, message: "Query is required" };
    }

    return { ok: true };
};

export { validateQuery };
