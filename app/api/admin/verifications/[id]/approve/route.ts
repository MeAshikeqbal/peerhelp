import { decide } from "../_decide";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return decide(request, id, "approved");
}
