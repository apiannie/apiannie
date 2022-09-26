import { LoaderArgs, redirect } from "@remix-run/node";

export const loader = ({ request, params }: LoaderArgs) => {
  const url = new URL(request.url);
  return redirect(url.pathname + "/apis" + url.search);
};

export default function Index() {
  return "Index";
}
