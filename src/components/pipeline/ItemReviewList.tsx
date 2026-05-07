'use client';

import { useState } from 'react';
import { Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';
import type { Category, Item } from '@/lib/supabase/types';
import { formatPriceCents } from '@/lib/format';

type ItemDraft = Pick<Item, 'id' | 'name_it' | 'description_it' | 'price_cents' | 'is_available' | 'category_id'>;

export function ItemReviewList({
  sessionId: _sessionId,
  categories,
  items: initialItems,
}: {
  sessionId: string;
  categories: Category[];
  items: Item[];
}) {
  const [items, setItems] = useState<ItemDraft[]>(initialItems);
  const [editing, setEditing] = useState<string | null>(null);

  function applyUpdate(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function saveItem(id: string, payload: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'save_failed');
      return true;
    } catch {
      return false;
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Excluir este item?')) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
  }

  const grouped = categories.map((c) => ({
    category: c,
    rows: items.filter((it) => it.category_id === c.id),
  }));
  const uncategorized = items.filter((it) => !it.category_id);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum item extraído. Volta pra coleta e adiciona mais fotos do menu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ category, rows }) => {
        if (rows.length === 0) return null;
        return (
          <section key={category.id}>
            <h2 className="font-display text-xl font-semibold tracking-tight tenant-primary">
              {category.name_it}
            </h2>
            <ul className="mt-2 space-y-2">
              {rows.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isEditing={editing === item.id}
                  onEdit={() => setEditing(item.id)}
                  onCancel={() => setEditing(null)}
                  onSave={async (patch) => {
                    const ok = await saveItem(item.id, patch);
                    if (ok) {
                      applyUpdate(item.id, patch);
                      setEditing(null);
                    }
                    return ok;
                  }}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
      {uncategorized.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">Sem categoria</h2>
          <ul className="mt-2 space-y-2">
            {uncategorized.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditing={editing === item.id}
                onEdit={() => setEditing(item.id)}
                onCancel={() => setEditing(null)}
                onSave={async (patch) => {
                  const ok = await saveItem(item.id, patch);
                  if (ok) {
                    applyUpdate(item.id, patch);
                    setEditing(null);
                  }
                  return ok;
                }}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ItemRow({
  item,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  item: ItemDraft;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<ItemDraft>) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name_it);
  const [priceEur, setPriceEur] = useState((item.price_cents / 100).toFixed(2).replace('.', ','));
  const [description, setDescription] = useState(item.description_it ?? '');
  const [saving, setSaving] = useState(false);

  if (isEditing) {
    return (
      <li className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-base"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">€</span>
            <input
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="h-10 w-24 rounded-md border border-input bg-background px-3 text-base"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-secondary"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const cents = parseEurToCents(priceEur);
                await onSave({
                  name_it: name.trim(),
                  description_it: description.trim() || null,
                  price_cents: cents,
                });
                setSaving(false);
              }}
              className="flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
              Salvar
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium">{item.name_it}</p>
          <p className="whitespace-nowrap text-sm tenant-primary">{formatPriceCents(item.price_cents)}</p>
        </div>
        {item.description_it && (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description_it}</p>
        )}
      </div>
      <div className="flex flex-shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function parseEurToCents(input: string): number {
  const normalized = input.replace(',', '.').replace(/[^\d.]/g, '');
  const value = parseFloat(normalized);
  if (!isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}
