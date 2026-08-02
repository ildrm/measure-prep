"use client";
import { useState } from "react";
export function Calculator() {
  const [display, setDisplay] = useState("0");
  function press(key: string) { if (key === "C") return setDisplay("0"); if (key === "=") { try { const safe = display.replace(/[^0-9+\-*/().]/g, ""); setDisplay(String(Function(`\"use strict\";return (${safe})`)())); } catch { setDisplay("Error"); } return; } setDisplay((value) => value === "0" || value === "Error" ? key : value + key); }
  return <details className="calculator"><summary>Calculator</summary><output>{display}</output><div>{["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","(",")","C"].map((key) => <button type="button" key={key} onClick={() => press(key)}>{key}</button>)}</div></details>;
}
