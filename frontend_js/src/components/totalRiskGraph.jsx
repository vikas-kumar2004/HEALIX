import React, { useEffect, useRef } from 'react';
import { useUserStore } from "../fdb/store";

function TotalRiskGraph() {
  const { user } = useUserStore();
  const canvasRef = useRef(null);

  
  const rValues = (user?.TOTAL_RISK_ARRAY || []).filter( // filter works on array
    (val) => typeof val === "number" && !isNaN(val)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rValues.length === 0) return;

    const context = canvas.getContext('2d');
    const width = canvas.width; // width = 500
    const height = canvas.height; // height = 200

  
    context.clearRect(0, 0, width, height);

    const maxVal = Math.max(...rValues, 1);
    const minVal = Math.min(...rValues, 0);
    const range = maxVal - minVal || 1;

    
    context.beginPath(); // refreshes the pen to draw
    context.strokeStyle = '#2563eb';  // color
    context.lineWidth = 3; // width


    const paddingLeft = 45;
    const paddingBottom = 30;
    const paddingTop = 20;
    const paddingRight = 20;
    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    let point_width = 18;


    for (let i = 1; i < rValues.length; i++) {

          ctx.beginPath();
          let X_old = 0 + (i-1) * point_width;
          let Y_old = 0 + 350 - (rValues[i-1] / Math.max(...rValues)) * 300;
          let X_new = 0 + (i) * point_width;
          let Y_new = 0 + 350 - (rValues[i] / Math.max(...rValues)) * 300;

          ctx.moveTo(X_old, Y_old);
          ctx.lineTo(X_new, Y_new);
          ctx.stroke();
      }

    context.stroke();

  
    context.fillStyle = '#4b5563';
    context.font = '12px sans-serif';

  
    context.textAlign = 'center';
    context.fillText('Time', paddingLeft + graphWidth / 2, height - 8);

  
    context.save(); 
    context.translate(15, paddingTop + graphHeight / 2);
    context.rotate(-Math.PI / 2); 
    context.textAlign = 'center';
    context.fillText('Total Risk', 0, 0);
    context.restore(); 

  }, [rValues]);

  return (
    <div className="bg-white p-6 rounded-lg shadow text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        User Risk Graph
      </h2>

      {rValues.length === 0 ? (
        <p className="text-gray-400 text-sm py-10">No risk data available yet</p>
      ) : (
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="border border-gray-200 rounded bg-gray-50"
          />
        </div>
      )}
    </div>
  );
}

export default TotalRiskGraph;