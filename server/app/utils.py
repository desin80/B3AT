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
    strict_sig = ",".join(ids)
    if len(ids) >= 6:
        strikers = ids[:4]
        specials = sorted(ids[4:])
        smart_sig = ",".join(strikers + specials)
    else:
        smart_sig = strict_sig
    return strict_sig, smart_sig
