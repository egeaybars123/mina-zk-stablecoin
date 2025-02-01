export async function fetchReserves(userId: number, nonce: number) {
    try {
        const response = await fetch(`http://localhost:3000/api/reserves?user=${userId}&nonce=${nonce}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data
    } catch (error) {
        console.error('Error fetching reserves:', error);
    }
}