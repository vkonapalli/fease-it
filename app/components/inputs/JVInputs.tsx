import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";

export function JVInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { jv } = inputs;

  const updateRound = (id: string, updates: Partial<typeof jv.rounds[0]>) => {
    setInputs({
      jv: {
        ...jv,
        rounds: jv.rounds.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      },
    });
  };

  const updateInvestor = (roundId: string, investorId: string, amount: number) => {
    setInputs({
      jv: {
        ...jv,
        rounds: jv.rounds.map((r) =>
          r.id === roundId
            ? {
                ...r,
                investors: r.investors.map((i) =>
                  i.id === investorId ? { ...i, amount } : i
                ),
                totalRaised: r.investors.reduce(
                  (sum, i) => sum + (i.id === investorId ? amount : i.amount),
                  0
                ),
              }
            : r
        ),
      },
    });
  };

  const addRound = () => {
    setInputs({
      jv: {
        ...jv,
        rounds: [
          ...jv.rounds,
          {
            id: crypto.randomUUID(),
            name: `Round ${jv.rounds.length + 1}`,
            totalRaised: 0,
            investors: [],
          },
        ],
      },
    });
  };

  const addInvestor = (roundId: string) => {
    setInputs({
      jv: {
        ...jv,
        rounds: jv.rounds.map((r) =>
          r.id === roundId
            ? {
                ...r,
                investors: [
                  ...r.investors,
                  { id: crypto.randomUUID(), name: "New Investor", amount: 0 },
                ],
              }
            : r
        ),
      },
    });
  };

  const removeInvestor = (roundId: string, investorId: string) => {
    setInputs({
      jv: {
        ...jv,
        rounds: jv.rounds.map((r) =>
          r.id === roundId
            ? {
                ...r,
                investors: r.investors.filter((i) => i.id !== investorId),
              }
            : r
        ),
      },
    });
  };

  const updateMoneyPartner = (id: string, updates: Partial<typeof jv.moneyPartners[0]>) => {
    setInputs({
      jv: {
        ...jv,
        moneyPartners: jv.moneyPartners.map((mp) => (mp.id === id ? { ...mp, ...updates } : mp)),
      },
    });
  };

  const addMoneyPartner = () => {
    setInputs({
      jv: {
        ...jv,
        moneyPartners: [
          ...jv.moneyPartners,
          { id: crypto.randomUUID(), name: "New Partner", amount: 0, interestRate: 15, monthsLoaned: 12 },
        ],
      },
    });
  };

  const removeMoneyPartner = (id: string) => {
    setInputs({
      jv: {
        ...jv,
        moneyPartners: jv.moneyPartners.filter((mp) => mp.id !== id),
      },
    });
  };

  return (
    <Collapsible title="JV / Capital Stack">
      <div className="space-y-4">
        <NumberField
          label="Developer Equity"
          value={jv.developerEquity}
          onChange={(value) => setInputs({ jv: { ...jv, developerEquity: value } })}
          prefix="$"
          min={0}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Investor Profit Share"
            value={jv.investorProfitSharePercent}
            onChange={(value) => setInputs({ jv: { ...jv, investorProfitSharePercent: value } })}
            suffix="%"
            min={0}
            max={100}
          />
          <NumberField
            label="Developer Profit Share"
            value={jv.developerProfitSharePercent}
            onChange={(value) => setInputs({ jv: { ...jv, developerProfitSharePercent: value } })}
            suffix="%"
            min={0}
            max={100}
          />
        </div>

        {/* Capital Rounds */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Capital Rounds</h4>
          {jv.rounds.map((round) => (
            <div key={round.id} className="border border-gray-200 rounded-lg p-3 mb-2 space-y-2">
              <input
                type="text"
                value={round.name}
                onChange={(e) => updateRound(round.id, { name: e.target.value })}
                className="font-medium text-sm bg-transparent border-none p-0 focus:ring-0 w-full"
              />
              {round.investors.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inv.name}
                    onChange={(e) =>
                      setInputs({
                        jv: {
                          ...jv,
                          rounds: jv.rounds.map((r) =>
                            r.id === round.id
                              ? {
                                  ...r,
                                  investors: r.investors.map((i) =>
                                    i.id === inv.id ? { ...i, name: e.target.value } : i
                                  ),
                                }
                              : r
                          ),
                        },
                      })
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                  <NumberField
                    label=""
                    value={inv.amount}
                    onChange={(value) => updateInvestor(round.id, inv.id, value)}
                    prefix="$"
                    min={0}
                  />
                  <button
                    type="button"
                    onClick={() => removeInvestor(round.id, inv.id)}
                    className="text-error hover:text-error/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addInvestor(round.id)}>
                <Plus className="h-4 w-4 mr-1" /> Investor
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addRound}>
            <Plus className="h-4 w-4 mr-1" /> Round
          </Button>
        </div>

        {/* Money Partners */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Money Partners (Debt)</h4>
          {jv.moneyPartners.map((mp) => (
            <div key={mp.id} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={mp.name}
                onChange={(e) => updateMoneyPartner(mp.id, { name: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <NumberField
                label=""
                value={mp.amount}
                onChange={(value) => updateMoneyPartner(mp.id, { amount: value })}
                prefix="$"
                min={0}
              />
              <NumberField
                label=""
                value={mp.interestRate}
                onChange={(value) => updateMoneyPartner(mp.id, { interestRate: value })}
                suffix="%"
                min={0}
                max={100}
              />
              <NumberField
                label=""
                value={mp.monthsLoaned}
                onChange={(value) => updateMoneyPartner(mp.id, { monthsLoaned: value })}
                suffix="mo"
                min={1}
              />
              <button
                type="button"
                onClick={() => removeMoneyPartner(mp.id)}
                className="text-error hover:text-error/80 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addMoneyPartner}>
            <Plus className="h-4 w-4 mr-1" /> Partner
          </Button>
        </div>
      </div>
    </Collapsible>
  );
}
