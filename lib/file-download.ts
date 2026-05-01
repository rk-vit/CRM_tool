import { sql } from "@/lib/db";

function csvmaker(data:any[]) {
    const headers = Object.keys(data[0]).join(",") + "\n";
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    return headers + rows;
}

const download = (data:any[]) => {
    const blob = new Blob([csvmaker(data)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.csv';
    a.click();
}

async function downloadLeadsCSV(filter:string) {
    let leadsData:any[] = [];
    if(filter === "all"){
        leadsData = await sql`SELECT * FROM leads`;
    }else if(filter === "new"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'new'`;
    }else if(filter === "contacted"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'contacted'`;
    }else if(filter === "qualified"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'qualified'`;
    }else if(filter === "contacted"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'contacted'`;
    }else if(filter === "reengaged"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'reengaged'`;
    }else if(filter === "negotiation"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'negotiation'`;
    }else if(filter === "won"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'won'`;
    }else if(filter === "lost"){
        leadsData = await sql`SELECT * FROM leads WHERE status = 'lost'`;
    }


    const csvData = csvmaker(leadsData);
    download(leadsData);
}

export default downloadLeadsCSV;