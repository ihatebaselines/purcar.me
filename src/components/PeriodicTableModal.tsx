"use client";

import React from "react";

export const PT_ELEMENTS: [number, string, string, number, number, string][] = [
  [1,"H","Hydrogen",1,1,"#60a5fa"],[2,"He","Helium",1,18,"#c084fc"],
  [3,"Li","Lithium",2,1,"#f87171"],[4,"Be","Beryllium",2,2,"#fb923c"],[5,"B","Boron",2,13,"#2dd4bf"],[6,"C","Carbon",2,14,"#60a5fa"],[7,"N","Nitrogen",2,15,"#60a5fa"],[8,"O","Oxygen",2,16,"#60a5fa"],[9,"F","Fluorine",2,17,"#818cf8"],[10,"Ne","Neon",2,18,"#c084fc"],
  [11,"Na","Sodium",3,1,"#f87171"],[12,"Mg","Magnesium",3,2,"#fb923c"],[13,"Al","Aluminum",3,13,"#4ade80"],[14,"Si","Silicon",3,14,"#2dd4bf"],[15,"P","Phosphorus",3,15,"#60a5fa"],[16,"S","Sulfur",3,16,"#60a5fa"],[17,"Cl","Chlorine",3,17,"#818cf8"],[18,"Ar","Argon",3,18,"#c084fc"],
  [19,"K","Potassium",4,1,"#f87171"],[20,"Ca","Calcium",4,2,"#fb923c"],[21,"Sc","Scandium",4,3,"#facc15"],[22,"Ti","Titanium",4,4,"#facc15"],[23,"V","Vanadium",4,5,"#facc15"],[24,"Cr","Chromium",4,6,"#facc15"],[25,"Mn","Manganese",4,7,"#facc15"],[26,"Fe","Iron",4,8,"#facc15"],[27,"Co","Cobalt",4,9,"#facc15"],[28,"Ni","Nickel",4,10,"#facc15"],[29,"Cu","Copper",4,11,"#facc15"],[30,"Zn","Zinc",4,12,"#facc15"],[31,"Ga","Gallium",4,13,"#4ade80"],[32,"Ge","Germanium",4,14,"#2dd4bf"],[33,"As","Arsenic",4,15,"#2dd4bf"],[34,"Se","Selenium",4,16,"#60a5fa"],[35,"Br","Bromine",4,17,"#818cf8"],[36,"Kr","Krypton",4,18,"#c084fc"],
  [37,"Rb","Rubidium",5,1,"#f87171"],[38,"Sr","Strontium",5,2,"#fb923c"],[39,"Y","Yttrium",5,3,"#facc15"],[40,"Zr","Zirconium",5,4,"#facc15"],[41,"Nb","Niobium",5,5,"#facc15"],[42,"Mo","Molybdenum",5,6,"#facc15"],[43,"Tc","Technetium",5,7,"#facc15"],[44,"Ru","Ruthenium",5,8,"#facc15"],[45,"Rh","Rhodium",5,9,"#facc15"],[46,"Pd","Palladium",5,10,"#facc15"],[47,"Ag","Silver",5,11,"#facc15"],[48,"Cd","Cadmium",5,12,"#facc15"],[49,"In","Indium",5,13,"#4ade80"],[50,"Sn","Tin",5,14,"#4ade80"],[51,"Sb","Antimony",5,15,"#2dd4bf"],[52,"Te","Tellurium",5,16,"#2dd4bf"],[53,"I","Iodine",5,17,"#818cf8"],[54,"Xe","Xenon",5,18,"#c084fc"],
  [55,"Cs","Cesium",6,1,"#f87171"],[56,"Ba","Barium",6,2,"#fb923c"],
  [57,"La","Lanthanum",9,4,"#f472b6"],[58,"Ce","Cerium",9,5,"#f472b6"],[59,"Pr","Praseodymium",9,6,"#f472b6"],[60,"Nd","Neodymium",9,7,"#f472b6"],[61,"Pm","Promethium",9,8,"#f472b6"],[62,"Sm","Samarium",9,9,"#f472b6"],[63,"Eu","Europium",9,10,"#f472b6"],[64,"Gd","Gadolinium",9,11,"#f472b6"],[65,"Tb","Terbium",9,12,"#f472b6"],[66,"Dy","Dysprosium",9,13,"#f472b6"],[67,"Ho","Holmium",9,14,"#f472b6"],[68,"Er","Erbium",9,15,"#f472b6"],[69,"Tm","Thulium",9,16,"#f472b6"],[70,"Yb","Ytterbium",9,17,"#f472b6"],[71,"Lu","Lutetium",9,18,"#f472b6"],
  [72,"Hf","Hafnium",6,4,"#facc15"],[73,"Ta","Tantalum",6,5,"#facc15"],[74,"W","Tungsten",6,6,"#facc15"],[75,"Re","Rhenium",6,7,"#facc15"],[76,"Os","Osmium",6,8,"#facc15"],[77,"Ir","Iridium",6,9,"#facc15"],[78,"Pt","Platinum",6,10,"#facc15"],[79,"Au","Gold",6,11,"#facc15"],[80,"Hg","Mercury",6,12,"#facc15"],[81,"Tl","Thallium",6,13,"#4ade80"],[82,"Pb","Lead",6,14,"#4ade80"],[83,"Bi","Bismuth",6,15,"#4ade80"],[84,"Po","Polonium",6,16,"#2dd4bf"],[85,"At","Astatine",6,17,"#818cf8"],[86,"Rn","Radon",6,18,"#c084fc"],
  [87,"Fr","Francium",7,1,"#f87171"],[88,"Ra","Radium",7,2,"#fb923c"],
  [89,"Ac","Actinium",10,4,"#fb7185"],[90,"Th","Thorium",10,5,"#fb7185"],[91,"Pa","Protactinium",10,6,"#fb7185"],[92,"U","Uranium",10,7,"#fb7185"],[93,"Np","Neptunium",10,8,"#fb7185"],[94,"Pu","Plutonium",10,9,"#fb7185"],[95,"Am","Americium",10,10,"#fb7185"],[96,"Cm","Curium",10,11,"#fb7185"],[97,"Bk","Berkelium",10,12,"#fb7185"],[98,"Cf","Californium",10,13,"#fb7185"],[99,"Es","Einsteinium",10,14,"#fb7185"],[100,"Fm","Fermium",10,15,"#fb7185"],[101,"Md","Mendelevium",10,16,"#fb7185"],[102,"No","Nobelium",10,17,"#fb7185"],[103,"Lr","Lawrencium",10,18,"#fb7185"],
  [104,"Rf","Rutherfordium",7,4,"#facc15"],[105,"Db","Dubnium",7,5,"#facc15"],[106,"Sg","Seaborgium",7,6,"#facc15"],[107,"Bh","Bohrium",7,7,"#facc15"],[108,"Hs","Hassium",7,8,"#facc15"],[109,"Mt","Meitnerium",7,9,"#facc15"],[110,"Ds","Darmstadtium",7,10,"#facc15"],[111,"Rg","Roentgenium",7,11,"#facc15"],[112,"Cn","Copernicium",7,12,"#facc15"],[113,"Nh","Nihonium",7,13,"#4ade80"],[114,"Fl","Flerovium",7,14,"#4ade80"],[115,"Mc","Moscovium",7,15,"#4ade80"],[116,"Lv","Livermorium",7,16,"#4ade80"],[117,"Ts","Tennessine",7,17,"#818cf8"],[118,"Og","Oganesson",7,18,"#c084fc"],
];

export function PeriodicTableModal({
  open,
  currentAtom,
  charge,
  onChargeChange,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentAtom: string;
  charge: number;
  onChargeChange: (c: number) => void;
  onSelect: (sym: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[1080px] max-h-[90vh] overflow-auto rounded-xl bg-[#101215] border border-white/15 p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Periodic Table (1 – 118)<span className="text-[#4a9390]">.</span></h3>
            <p className="text-xs text-zinc-400">Select an element and optional formal charge for Add Atom.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Charge:</span>
            <select
              value={charge}
              onChange={(e) => onChargeChange(parseInt(e.target.value) || 0)}
              className="px-2 py-1 rounded bg-[#15181c] border border-white/15 text-xs text-zinc-100"
            >
              {[-3, -2, -1, 0, 1, 2, 3, 4].map((c) => (
                <option key={c} value={c}>{c > 0 ? `+${c}` : c}</option>
              ))}
            </select>
            <button onClick={onClose} className="px-3 py-1 rounded bg-[#15181c] border border-white/15 text-xs hover:border-[#4a9390]">
              Close
            </button>
          </div>
        </div>
        <div className="grid gap-1 min-w-[780px]" style={{ gridTemplateColumns: "repeat(18, minmax(42px, 1fr))" }}>
          {PT_ELEMENTS.map(([z, sym, name, row, col, color]) => (
            <button
              key={z}
              type="button"
              onClick={() => { onSelect(sym); onClose(); }}
              style={{ gridRow: row, gridColumn: col, borderTop: `2px solid ${color}` }}
              className={`p-1 rounded bg-[#15181c] border text-center transition hover:scale-105 ${
                currentAtom === sym ? "border-[#5cb0ac] bg-[#4a9390]/20" : "border-white/10"
              }`}
              title={`${z} ${name} (${sym})`}
            >
              <span className="block text-[9px] text-zinc-400 leading-none">{z}</span>
              <span className="block text-xs font-bold text-zinc-100 leading-tight">{sym}</span>
              <span className="block text-[8px] text-zinc-500 truncate">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
