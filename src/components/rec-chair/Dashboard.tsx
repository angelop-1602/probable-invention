import * as React from "react";
import Summary from "./dashboard/Summary";

export default function Dashboard() {
  return (
    <>
    <Summary />
    <div className="grid gap-6">
      
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
        <p className="text-gray-500 italic">No recent submissions found.</p>
      </section>

      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Completed Reviews</h2>
        <p className="text-gray-500 italic">No completed reviews found.</p>
      </section>
    </div>
    </>
  );
}
