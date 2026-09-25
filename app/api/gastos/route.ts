import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export interface Gasto {
  id: string;
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
}

const REDIS_KEY = 'casipizza:gastos';

// Obtener todos los gastos
export async function GET() {
  try {
    const gastos = await redis.get<Gasto[]>(REDIS_KEY) || [];
    return NextResponse.json(gastos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
  }
}

// Guardar un nuevo gasto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { monto, categoria, descripcion } = body;

    if (!monto || !categoria) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const nuevoGasto: Gasto = {
      id: `gasto_${Date.now()}`,
      monto: parseFloat(monto),
      categoria,
      descripcion: descripcion || '',
      fecha: new Date().toISOString(),
    };

    const gastosActuales = await redis.get<Gasto[]>(REDIS_KEY) || [];
    const nuevosGastos = [nuevoGasto, ...gastosActuales];

    await redis.set(REDIS_KEY, nuevosGastos);

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar el gasto' }, { status: 500 });
  }
}