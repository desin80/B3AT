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
    return normalize_team(team_list)


def normalize_team(team_list):
    if not team_list:
        return [], ""

    strikers = []
    specials = []

    for pid in team_list:
        s_pid = str(pid)
        if s_pid.startswith("2"):
            specials.append(pid)
        else:
            strikers.append(pid)

    specials.sort(key=lambda x: int(x))

    final_list = strikers + specials
    sig = ",".join(str(x) for x in final_list)

    return final_list, sig
