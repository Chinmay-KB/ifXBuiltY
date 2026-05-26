import { productApprovalHook } from "../hooks/product-approval";
import {
  fetchPageContent,
  findOfficialSources,
  saveProductDraft,
  summarizeMemeDna,
  summarizeProductProfile,
} from "./steps";

export type ResearchProductResult = {
  productId: string;
  status: "approved" | "needs_review" | "rejected";
  draft: Record<string, unknown> | null;
  comment?: string;
};

export async function researchProduct(productId: string): Promise<ResearchProductResult> {
  "use workflow";

  const sources = await findOfficialSources(productId);

  const fetchedContent = await Promise.all(
    sources.officialUrls.slice(0, 3).map((url) => fetchPageContent(url)),
  );

  const validSources = fetchedContent.filter((s) => s.content !== null);

  if (validSources.length === 0) {
    return {
      productId,
      status: "rejected",
      draft: null,
      comment: "No accessible source pages found",
    };
  }

  const profileDraft = await summarizeProductProfile(productId, validSources);
  const memeDraft = await summarizeMemeDna(productId);

  const saved = await saveProductDraft(
    productId,
    profileDraft,
    memeDraft,
    validSources.map((s) => s.url),
  );

  const approval = await productApprovalHook.create({ token: productId });
  const { approved, comment, edits } = await approval;

  if (!approved) {
    return {
      productId,
      status: "rejected",
      draft: saved.draft,
      comment: comment ?? "Rejected by reviewer",
    };
  }

  const finalDraft = { ...saved.draft, ...(edits ?? {}) };
  return {
    productId,
    status: "approved",
    draft: finalDraft,
    comment: comment ?? "Approved",
  };
}
