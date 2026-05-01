"use client";

function csvmaker(data: any[]) {
    const headers = Object.keys(data[0]).join(",") + "\n";
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    return headers + rows;
}

const download = (data: any[]) => {
    try {
        const csvContent = csvmaker(data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'download.csv';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('CSV download failed:', error);
    }
}

async function downloadLeadsCSV(filter: string) {
    try {
        let leadsData: any[] = [];

        if (filter === "all") {
            leadsData = await fetch('/api/leads').then(res => res.json());
        } else if (filter === "new") {
            leadsData = await fetch(`/api/leads?status=new`).then(res => res.json());
        } else if (filter === "contacted") {
            leadsData = await fetch(`/api/leads?status=contacted`).then(res => res.json());
        } else if (filter === "qualified") {
            leadsData = await fetch(`/api/leads?status=qualified`).then(res => res.json());
        } else if (filter === "reengaged") {
            leadsData = await fetch(`/api/leads?status=reengaged`).then(res => res.json());
        } else if (filter === "negotiation") {
            leadsData = await fetch(`/api/leads?status=negotiation`).then(res => res.json());
        } else if (filter === "won") {
            leadsData = await fetch(`/api/leads?status=won`).then(res => res.json());
        } else if (filter === "lost") {
            leadsData = await fetch(`/api/leads?status=lost`).then(res => res.json());
        }

        download(leadsData);
    } catch (error) {
        console.error('Failed to fetch leads for CSV:', error);
    }
}

export default downloadLeadsCSV;