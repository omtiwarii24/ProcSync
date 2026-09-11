import hashlib
import re

from app.ai.seed_index import SEED_INDEX

_WORD_RE = re.compile(r"[a-z0-9]+")
_EMBED_DIM = 768


def _normalize(text: object) -> str:
    return re.sub(r"\s+", " ", str(text or "").lower()).strip()


def _tokens(text: object) -> set:
    return set(_WORD_RE.findall(str(text or "").lower()))


def _keyword_matches(keyword: str, norm_text: str, text_tokens: set) -> bool:
    keyword = _normalize(keyword)
    if not keyword:
        return False
    words = keyword.split(" ")
    if len(words) == 1:
        return words[0] in text_tokens
    return keyword in norm_text


class MockAI:
    _AMOUNT_RE = re.compile(
        r"(?:\u20b9|\brs\b\.?|\binr\b)\s*([\d,]+(?:\.\d{1,2})?)", re.IGNORECASE)
    _FISCAL_RE = re.compile(
        r"\b(?:fy\s*)?\d{4}\s*[-/]\s*(?:\d{2}|\d{4})\b", re.IGNORECASE)
    _DATE_RE = re.compile(r"\b\d{1,2}[-/][a-z0-9]+[-/]\d{2,4}\b", re.IGNORECASE)
    _DURATION_RE = re.compile(
        r"\b\d+\s*(?:days?|weeks?|months?|years?)\b", re.IGNORECASE)
    _NUMBER_RE = re.compile(r"\b\d[\d,]*(?:\.\d+)?\b")
    _EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

    def discover_startups(self, problem_statement: str, domain: str,
                          location_hint: str = "Maharashtra India") -> list[dict]:
        norm = _normalize(problem_statement)
        toks = _tokens(problem_statement)
        scored = []
        for entry in SEED_INDEX:
            matched = sorted(
                k for k in entry["keywords"] if _keyword_matches(k, norm, toks))
            if not matched:
                continue
            score = round(min(0.95, len(matched) / 3), 4)
            scored.append({
                "name": entry["name"],
                "website": entry["website"],
                "sector": entry["sector"],
                "location": entry["location"],
                "relevance_score": score,
                "relevance_evidence": (
                    f"Matched {len(matched)} seed-index keywords: "
                    f"{', '.join(matched)}"),
            })
        scored.sort(key=lambda item: (-item["relevance_score"], item["name"]))
        return scored[:10]

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors = []
        for text in texts:
            digest = hashlib.md5(str(text).encode("utf-8")).digest()
            vectors.append([
                (digest[i % len(digest)] - 127.5) / 127.5
                for i in range(_EMBED_DIM)
            ])
        return vectors

    def extract(self, evidence_text: str, evidence_type: str) -> dict:
        text = str(evidence_text or "")
        etype = str(evidence_type or "").lower().strip()
        if etype in {"budget", "financial", "expenditure", "sanction"}:
            patterns = (
                (self._AMOUNT_RE, lambda m: m.group(1).replace(",", "")),
                (self._FISCAL_RE, lambda m: m.group(0).strip()),
            )
            keys = ("amounts", "fiscal_years")
        elif etype in {"timeline", "schedule", "milestone", "plan"}:
            patterns = (
                (self._DATE_RE, lambda m: m.group(0)),
                (self._DURATION_RE, lambda m: m.group(0).strip()),
            )
            keys = ("dates", "durations")
        else:
            patterns = (
                (self._NUMBER_RE, lambda m: m.group(0).replace(",", "")),
                (self._EMAIL_RE, lambda m: m.group(0)),
            )
            keys = ("numbers", "emails")
        extracted: dict = {key: [] for key in keys}
        first_span_src = None
        for (pattern, clean), key in zip(patterns, keys):
            for match in pattern.finditer(text):
                extracted[key].append(clean(match))
                if first_span_src is None:
                    first_span_src = match.group(0)
        total = sum(len(v) for v in extracted.values())
        confidence = round(min(0.95, 0.25 + 0.15 * total), 4)
        return {
            "extracted_data": extracted,
            "confidence": confidence,
            "source_span": self._span_for(text, first_span_src),
        }

    def compare_contexts(self, new_ctx: dict, historical_ctx: dict) -> dict:
        new_ctx = new_ctx or {}
        historical_ctx = historical_ctx or {}
        scores: dict = {}
        for key in sorted(set(new_ctx) | set(historical_ctx)):
            scores[str(key)] = self._similarity(
                new_ctx.get(key), historical_ctx.get(key))
        return scores

    def draft_explanation(self, decision_output: dict) -> str:
        data = decision_output or {}
        decision = str(data.get("decision", "UNKNOWN"))
        score = float(data.get("score", 0.0) or 0.0)
        reasons = [str(r) for r in data.get("reasons", [])]
        reason_text = "; ".join(reasons) if reasons else "no explicit reasons provided"
        return (f"Decision: {decision} (overall score {score:.2f}). "
                f"Key factors: {reason_text}.")

    @staticmethod
    def _similarity(a: object, b: object) -> float:
        if a is None or b is None:
            return 0.0
        sa = str(a).strip().lower()
        sb = str(b).strip().lower()
        if sa == sb:
            return 1.0
        ta = _WORD_RE.findall(sa)
        tb = _WORD_RE.findall(sb)
        if not ta or not tb:
            return 0.0
        return round(len(set(ta) & set(tb)) / len(set(ta) | set(tb)), 4)

    @staticmethod
    def _span_for(text: str, first_match: object) -> str:
        if not text:
            return ""
        if first_match is None:
            return text[:200].strip()
        idx = text.find(str(first_match))
        start = text.rfind(".", 0, idx) + 1
        end = text.find(".", idx)
        end = len(text) if end < 0 else end + 1
        return text[start:end].strip()
