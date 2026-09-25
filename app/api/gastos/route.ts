import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis'; // Asegúrate que tu cliente exporte redis o adapte a tu lib

export async function GET() {
  try {
    const data = await redis.get('gastos');
    const gastos = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
    return NextResponse.json(gastos);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error al conectar con la base de datos: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { monto, categoria, descripcion } = body;

    if (!monto || isNaN(Number(monto))) {
      return NextResponse.json({ error: 'El monto no es válido' }, { status: 400 });
    }

    const data = await redis.get('gastos');
    const gastos = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];

    const nuevoGasto = {
      id: Date.now().toString(),
      monto: Number(monto),
      categoria,
      descripcion,
      fecha: new Date().toISOString(),
    };

    gastos.unshift(nuevoGasto);
    await redis.set('gastos', JSON.stringify(gastos));

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'No se pudo guardar en la base de datos: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del registro' }, { status: 400 });
    }

    const data = await redis.get('gastos');
    let gastos = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];

    gastos = gastos.filter((g: any) => g.id !== id);
    await redis.set('gastos', JSON.stringify(gastos));

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'No se pudo eliminar el registro: ' + error.message },
      { status: 500 }
    );
  }
}