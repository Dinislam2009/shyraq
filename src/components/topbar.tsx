import { SearchIcon } from "@/components/icons";

export function Topbar() {
  return (
    <header className="flex h-18 items-center justify-between border-b border-black/[0.06] bg-white/90 px-5 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">S</span>
        <span className="font-semibold">Shyraq</span>
      </div>
      <div className="relative hidden w-full max-w-md md:block">
        <SearchIcon size={17} />
        <input aria-label="Search" placeholder="Search decks, cards, tags..." className="absolute inset-y-0 left-8 w-[calc(100%-2rem)] bg-transparent text-sm outline-none placeholder:text-slate-400" />
        <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 pl-3 text-slate-400"><span className="ml-5 text-xs">⌘ K</span></div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">Dinis</p>
          <p className="text-xs text-slate-400">Student</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">D</div>
      </div>
    </header>
  );
}