"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate, useAuthSession } from "../../components/auth-gate";
import {
  archiveFlashcardDeck,
  createFlashcard,
  createFlashcardDeck,
  deleteFlashcard,
  getFlashcardDecks,
  getFlashcards,
  getFlashcardProgress,
  reviewFlashcard,
  type Flashcard,
  type FlashcardDeck,
  type FlashcardProgress,
} from "../../lib/api";

function LearningPageContent() {
  const session = useAuthSession();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selected, setSelected] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<FlashcardProgress | null>(null);
  const [name, setName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getFlashcardDecks(session.access_token).then(setDecks).catch((e) => setError(e instanceof Error ? e.message : "Failed to load decks"));
  }, [session]);

  useEffect(() => {
    if (!session || !selected) return;
    setIndex(0);
    setRevealed(false);
    setProgress(null);
    Promise.all([
      getFlashcards(selected.id, session.access_token),
      getFlashcardProgress(selected.id, session.access_token),
    ]).then(([nextCards, nextProgress]) => { setCards(nextCards); setProgress(nextProgress); }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load learning data"));
  }, [session, selected]);

  if (!session) return null;
  const current = cards[index];

  async function addDeck() {
    if (!name.trim()) return;
    try {
      const deck = await createFlashcardDeck({ name: name.trim() }, session!.access_token);
      setDecks((items) => [deck, ...items]);
      setSelected(deck);
      setName("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create deck"); }
  }

  async function addCard() {
    if (!selected || !front.trim() || !back.trim()) return;
    try {
      const card = await createFlashcard(selected.id, { front: front.trim(), back: back.trim(), position: cards.length }, session!.access_token);
      setCards((items) => [...items, card]);
      setProgress((value) => value ? { ...value, cardCount: value.cardCount + 1, completionPercent: 0 } : value);
      setFront(""); setBack("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create card"); }
  }

  async function removeCard(cardId: string) {
    if (!selected) return;
    try { await deleteFlashcard(selected.id, cardId, session!.access_token); setCards((items) => items.filter((card) => card.id !== cardId)); setIndex(0); setRevealed(false); const next = await getFlashcardProgress(selected.id, session!.access_token); setProgress(next); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to delete card"); }
  }

  async function archiveDeck(deckId: string) {
    try { await archiveFlashcardDeck(deckId, session!.access_token); setDecks((items) => items.filter((deck) => deck.id !== deckId)); if (selected?.id === deckId) { setSelected(null); setCards([]); setProgress(null); } }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to archive deck"); }
  }

  async function submitReview(correct: boolean) {
    if (!selected || !current) return;
    try {
      await reviewFlashcard(selected.id, current.id, correct, session!.access_token);
      const next = await getFlashcardProgress(selected.id, session!.access_token);
      setProgress(next);
      setIndex((value) => cards.length ? (value + 1) % cards.length : 0);
      setRevealed(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save review"); }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">SHYRAQ</div>
        <p className="brand-subtitle">Productivity & learning OS</p>
        <nav aria-label="Primary navigation" className="nav-list">
          <Link className="nav-item" href="/">Today</Link>
          <Link className="nav-item" href="/tasks">Tasks</Link>
          <Link className="nav-item" href="/projects">Projects</Link>
          <Link className="nav-item" href="/calendar">Calendar</Link>
          <Link className="nav-item" href="/habits">Habits</Link>
          <Link className="nav-item nav-item-active" href="/learning">Learning</Link>
        </nav>
      </aside>

      <section className="content-panel">
        <header className="topbar"><div><p className="eyebrow">Phase 8</p><h1>Learning</h1></div></header>
        {error && <p role="alert">{error}</p>}
        <div className="board-grid">
          <section className="card-panel">
            <h2>Decks</h2>
            <div className="inline-form"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New deck" /><button onClick={addDeck}>Create</button></div>
            {decks.map((deck) => <div key={deck.id} className="list-row"><button onClick={() => setSelected(deck)}>{deck.name} ({deck._count?.cards ?? 0})</button><button onClick={() => archiveDeck(deck.id)}>Archive</button></div>)}
          </section>

          <section className="card-panel">
            <h2>{selected ? selected.name : "Select a deck"}</h2>
            {selected && <>
              {progress && <div className="progress-summary" aria-label="Learning progress"><strong>{progress.completionPercent}% reviewed</strong><span>{progress.reviewedCardCount}/{progress.cardCount} cards · {progress.correctCount}/{progress.reviewCount} correct</span></div>}
              <div className="review-card" onClick={() => setRevealed((value) => !value)} role="button" tabIndex={0}>
                {current ? <><strong>{revealed ? current.back : current.front}</strong><span>{revealed ? "Answer" : "Question"}</span></> : <span>No cards yet</span>}
              </div>
              {current && <>
                <div className="inline-form"><button onClick={() => { setIndex((index + cards.length - 1) % cards.length); setRevealed(false); }}>Previous</button><span>{index + 1} / {cards.length}</span><button onClick={() => { setIndex((index + 1) % cards.length); setRevealed(false); }}>Next</button></div>
                {revealed && <div className="inline-form"><button onClick={() => submitReview(false)}>Need review</button><button onClick={() => submitReview(true)}>Got it</button></div>}
              </>}
              <div className="stack-form"><input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question / front" /><textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Answer / back" /><button onClick={addCard}>Add card</button></div>
              {cards.map((card) => <div key={card.id} className="list-row"><span>{card.front}</span><button onClick={() => removeCard(card.id)}>Delete</button></div>)}
            </>}
          </section>
        </div>
      </section>
    </main>
  );
}

export default function LearningPage() { return <AuthGate><LearningPageContent /></AuthGate>; }
