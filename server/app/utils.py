import math


def wilson_lower_bound(wins, n, z=1.96):
    if n == 0:
        return 0.0
    phat = wins / n
    numerator = (
        phat
        + z * z / (2 * n)
        - z * math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)
    )
    denominator = 1 + z * z / n
    return numerator / denominator


def posterior_mean(wins, n, alpha=1, beta=1):
    return (wins + alpha) / (n + alpha + beta)


def generate_signatures(team_list):
    ids = [str(i) for i in team_list]
    raw_sig = ",".join(ids)
    strict_sig = raw_sig
    smart_sig = normalize_to_smart_sig(raw_sig)
    return strict_sig, smart_sig


def normalize_to_smart_sig(sig_str: str) -> str:
    if not sig_str:
        return ""

    parts = [x.strip() for x in sig_str.split(",") if x.strip()]

    strikers = []
    specials = []

    for pid in parts:
        if pid.startswith("2"):
            specials.append(pid)
        else:
            strikers.append(pid)
    specials.sort(key=lambda x: int(x) if x.isdigit() else x)
    final_list = strikers + specials
    return ",".join(final_list)
