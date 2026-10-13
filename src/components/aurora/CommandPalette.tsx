import { Command } from "cmdk";
import { CornerDownLeft, Plus, Search } from "lucide-react";
import { SECTIONS, type SectionId } from "./navigation";

/**
 * ⌘K palette: jump to any section or run a quick action. Built on cmdk's own
 * Radix dialog so it gets focus trapping, Esc and scroll lock for free.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onAddBroker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (id: SectionId) => void;
  onAddBroker: () => void;
}) {
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Paleta de comandos"
      overlayClassName="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]"
      contentClassName="fixed left-1/2 top-[14vh] z-50 w-[min(560px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[20px] border border-white/14 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] focus:outline-none"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <div
        className="flex flex-col"
        style={{
          background: "linear-gradient(160deg, rgba(18,22,34,0.97) 0%, rgba(8,12,22,0.97) 100%)",
          backdropFilter: "blur(40px) saturate(160%)",
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-white/8 px-4">
          <Search size={15} className="shrink-0 text-white/45" />
          <Command.Input
            placeholder="Ir para secção ou executar ação…"
            className="h-12 w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/35"
          />
          <kbd className="hidden shrink-0 rounded-md border border-white/12 px-1.5 py-0.5 text-[10px] text-white/45 sm:inline">
            Esc
          </kbd>
        </div>
        <Command.List className="thin-scrollbar max-h-[min(420px,60vh)] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-[12px] text-white/45">
            Sem resultados.
          </Command.Empty>
          <Command.Group
            heading="Ações"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-white/40"
          >
            <PaletteItem
              value="adicionar corretora broker ligar conta"
              icon={Plus}
              label="Adicionar corretora"
              hint="Abre o assistente de ligação"
              onSelect={() => run(onAddBroker)}
            />
          </Command.Group>
          <Command.Group
            heading="Secções"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-white/40"
          >
            {SECTIONS.map((s) => (
              <PaletteItem
                key={s.id}
                value={`${s.label} ${s.hint}`}
                icon={s.icon}
                label={s.label}
                hint={s.hint}
                onSelect={() => run(() => onNavigate(s.id))}
              />
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function PaletteItem({
  value,
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  value: string;
  icon: React.ElementType;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-[12px] text-white/80 data-[selected=true]:bg-[rgba(74,158,255,0.16)] data-[selected=true]:text-white"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white/6 text-white/70 group-data-[selected=true]:text-[var(--aurora-accent)]">
        <Icon size={15} strokeWidth={1.85} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{label}</span>
        <span className="block truncate text-[10px] text-white/45">{hint}</span>
      </span>
      <CornerDownLeft
        size={13}
        className="shrink-0 text-white/30 opacity-0 group-data-[selected=true]:opacity-100"
      />
    </Command.Item>
  );
}
