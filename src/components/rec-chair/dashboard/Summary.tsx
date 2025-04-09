import * as React from "react";

export default function Summary() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Summary</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 ">
        <div className="bg-background p-4 rounded-md shadow-xl border">
          <h3 className="font-medium">Total Applications</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-background p-4 rounded-md shadow-xl border">
          <h3 className="font-medium">Approved</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-background p-4 rounded-md shadow-xl border">
          <h3 className="font-medium">Under Review</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-background p-4 rounded-md shadow-xl border">
          <h3 className="font-medium">Progress Report</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </>
  );
}
