import initRDKitModule, { type MainModule } from "@rdkit/rdkit";

export interface SmilesGraphNode {
  element: string;
  charge: number;
  x: number;
  y: number;
}

export interface SmilesGraphEdge {
  u: number;
  v: number;
  bond_type: number;
}

export interface SmilesGraph {
  nodes: SmilesGraphNode[];
  edges: SmilesGraphEdge[];
  canonicalSmiles: string;
}

interface RDKitAtom {
  z?: number;
  chg?: number;
}

interface RDKitBond {
  atoms: [number, number];
  bo?: number;
}

interface RDKitJson {
  defaults?: { atom?: RDKitAtom; bond?: RDKitBond };
  molecules?: Array<{
    atoms?: RDKitAtom[];
    bonds?: RDKitBond[];
    extensions?: Array<{ name?: string; aromaticBonds?: number[] }>;
  }>;
}

const ELEMENTS = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ");

let rdkitPromise: Promise<MainModule> | null = null;

function getRDKit() {
  if (!rdkitPromise) {
    rdkitPromise = initRDKitModule({ locateFile: (file: string) => file.endsWith(".wasm") ? "/rdkit/RDKit_minimal.wasm" : file });
  }
  return rdkitPromise;
}

function parse2DCoordinates(molBlock: string, atomCount: number) {
  const lines = molBlock.split(/\r?\n/);
  const countsLine = lines.findIndex((line) => /V\d{4}/.test(line));
  if (countsLine < 0) return null;

  const coordinates: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < atomCount; index++) {
    const fields = lines[countsLine + index + 1]?.trim().split(/\s+/) ?? [];
    const x = Number(fields[0]);
    const y = Number(fields[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    coordinates.push({ x, y });
  }
  return coordinates;
}

export async function parseSmiles(smiles: string): Promise<SmilesGraph> {
  const input = smiles.trim();
  if (!input) throw new Error("Enter a SMILES string first.");

  const RDKit = await getRDKit();
  const mol = RDKit.get_mol(input);
  if (!mol) {
    if (/^[A-Z][A-Za-z]?\d/.test(input)) {
      throw new Error("That looks like a molecular formula, not SMILES. For potassium permanganate, try [K+].[Mn+7](=O)(=O)(=O)[O-].");
    }
    throw new Error("Could not parse this SMILES. Check atom symbols, brackets, bond marks, and ring numbers.");
  }

  try {
    const parsed = JSON.parse(mol.get_json()) as RDKitJson;
    const data = parsed.molecules?.[0];
    if (!data?.atoms?.length) throw new Error("This SMILES did not contain any atoms.");

    const atoms = data.atoms;
    const atomDefaults = parsed.defaults?.atom ?? { z: 6, chg: 0 };
    const bondDefaults = parsed.defaults?.bond ?? { bo: 1 };
    const aromaticBonds = new Set(
      data.extensions?.find((extension) => extension.name === "rdkitRepresentation")?.aromaticBonds ?? [],
    );
    const coordinates = parse2DCoordinates(mol.get_new_coords(), atoms.length);
    const nodes = atoms.map((atom, index) => {
      const atomicNumber = atom.z ?? atomDefaults.z ?? 6;
      const element = ELEMENTS[atomicNumber - 1];
      if (!element) throw new Error(`Unsupported atomic number ${atomicNumber}.`);
      const fallbackAngle = (2 * Math.PI * index) / Math.max(atoms.length, 1);
      const position = coordinates?.[index];
      return {
        element,
        charge: atom.chg ?? atomDefaults.chg ?? 0,
        x: position?.x ?? Math.cos(fallbackAngle),
        y: position?.y ?? Math.sin(fallbackAngle),
      };
    });

    const edges = (data.bonds ?? []).map((bond, index) => {
      const order = bond.bo ?? bondDefaults.bo ?? 1;
      const bondType = aromaticBonds.has(index) || order === 1.5
        ? 4
        : Math.max(1, Math.min(3, Math.round(order)));
      return { u: bond.atoms[0], v: bond.atoms[1], bond_type: bondType };
    });

    return { nodes, edges, canonicalSmiles: mol.get_smiles() };
  } finally {
    mol.delete();
  }
}
