import { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "My Favorites | Oma Hub",
  description: "Your saved favorite fashion brands and designers",
};

export default function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>
      <FavoritesClient />
    </main>
  );
}
