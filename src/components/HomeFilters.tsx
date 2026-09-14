"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Select } from "@/components/Select";

export function HomeFilters({
  creator,
  creatorType,
  sort,
  creatorOptions,
  labels,
}: {
  creator: string;
  creatorType: string;
  sort: string;
  creatorOptions: { value: string; label: string }[];
  labels: {
    filterCreator: string;
    allCreators: string;
    filterCreatorType: string;
    creatorTypeAll: string;
    creatorTypeAssociation: string;
    sortCreated: string;
    sortEnd: string;
    sortScore: string;
  };
}) {
  const router = useRouter();
  const [sortValue, setSortValue] = useState(sort);
  const [creatorValue, setCreatorValue] = useState(creator);
  const [creatorTypeValue, setCreatorTypeValue] = useState(creatorType);

  useEffect(() => {
    setSortValue(sort);
  }, [sort]);

  useEffect(() => {
    setCreatorValue(creator);
  }, [creator]);

  useEffect(() => {
    setCreatorTypeValue(creatorType);
  }, [creatorType]);

  function applyFilters(next?: {
    creator?: string;
    creatorType?: string;
    sort?: string;
  }) {
    const nextCreator = next?.creator ?? creatorValue;
    const nextCreatorType = next?.creatorType ?? creatorTypeValue;
    const nextSort = next?.sort ?? (sortValue || "created_at");
    const params = new URLSearchParams();
    if (nextCreator) params.set("creator", nextCreator);
    if (nextCreatorType && nextCreatorType !== "all") {
      params.set("creatorType", nextCreatorType);
    }
    params.set("sort", nextSort);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    router.refresh();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters();
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={onSubmit}
    >
      <label className="min-w-56 flex-1 text-sm">
        <span className="mb-1 block muted">{labels.filterCreator}</span>
        <Select
          value={creatorValue}
          onChange={(value) => {
            setCreatorValue(value);
            applyFilters({ creator: value });
          }}
          aria-label={labels.filterCreator}
          options={[
            { value: "", label: labels.allCreators },
            ...(creatorOptions ?? []),
          ]}
        />
      </label>
      <label className="min-w-44 text-sm">
        <span className="mb-1 block muted">{labels.filterCreatorType}</span>
        <Select
          value={creatorTypeValue}
          onChange={(value) => {
            setCreatorTypeValue(value);
            applyFilters({ creatorType: value });
          }}
          aria-label={labels.filterCreatorType}
          options={[
            { value: "all", label: labels.creatorTypeAll },
            {
              value: "association",
              label: labels.creatorTypeAssociation,
            },
          ]}
        />
      </label>
      <label className="min-w-48 text-sm">
        <span className="mb-1 block muted">Sort</span>
        <Select
          value={sortValue}
          onChange={(value) => {
            setSortValue(value);
            applyFilters({ sort: value });
          }}
          aria-label="Sort polls"
          options={[
            { value: "created_at", label: labels.sortCreated },
            { value: "end_at", label: labels.sortEnd },
            { value: "score", label: labels.sortScore },
          ]}
        />
      </label>
      <button className="btn btn-secondary" type="submit">
        Apply
      </button>
    </form>
  );
}
