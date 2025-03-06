export function isMatchingDomain(inputUrl, domain) {
    let hostname;
    try {
        const url = new URL(inputUrl);
        hostname = url.hostname;
    } catch (e) {
        try {
            const urlWithProtocol = new URL('http://' + inputUrl);
            hostname = urlWithProtocol.hostname;
        } catch (e) {
            return false;
        }
    }

    hostname = hostname.replace(/\.+$/, '').toLowerCase();
    
    const normalizedDomain = domain.replace(/\.+$/, '').toLowerCase();
    return isSubdomainOrExact(hostname, normalizedDomain);
}

export function normalizeDomain(domain) {
    console.log("Domain", domain);
    let hostname;
    try {
        const url = new URL(domain);
        hostname = url.hostname;
    } catch (e) {
        try {
            const urlWithProtocol = new URL('http://' + domain);
            hostname = urlWithProtocol.hostname;
        } catch (e) {
            return false;
        }
    }
    return hostname.replace(/\.+$/, '').toLowerCase();
}

export function isSubdomainOrExact(hostname, domain) {
    if (hostname === domain) {
        return true;
    }

    const hostParts = hostname.split('.').reverse();
    const domainParts = domain.split('.').reverse();

    if (domainParts.length > hostParts.length) {
        return false;
    }

    for (let i = 0; i < domainParts.length; i++) {
        if (domainParts[i] !== hostParts[i]) {
            return false;
        }
    }

    return true;
}