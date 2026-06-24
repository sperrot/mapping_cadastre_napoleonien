# =====================================================================
# Scout + moisson du cadastre napoléonien — Calvados (FRAD014)
# ---------------------------------------------------------------------
# Lance scout_cadastre.py sur chaque finding aid du fonds cadastre :
#   - reconnaissance licence + IIIF (échantillon) ;
#   - moisson (--run) → un seed SQL par tranche de communes ;
#   - concaténation en un seul fichier UTF-8 (sans BOM) prêt pour Supabase.
#
# À lancer depuis le dossier harvest/ (ou n'importe où : se replace seul).
#
# Usage :
#   .\scout_calvados.ps1                # reconnaissance + moisson + seed combiné
#   .\scout_calvados.ps1 -ReconOnly     # reconnaissance seule (aucun SQL écrit)
#   .\scout_calvados.ps1 -YearMin 1790 -YearMax 1860
# =====================================================================

param(
    [switch]$ReconOnly,
    [int]$YearMin = 1790,
    [int]$YearMax = 1860
)

Set-Location $PSScriptRoot

# Finding aids du fonds cadastre Calvados (FRAD014, service/33495).
# ⚠ Tranche « Le Me → Z » encore manquante : ajouter une ligne quand récupérée.
$findingAids = @(
    @{ Range = "A-D";    Id = "d17231b4a0689ac142534b2a6ee4fc0c190338a1" },
    @{ Range = "E-LeMe"; Id = "c89ef2c4dfe0d59b57752e97961d4f0b9d067601" }
)

$seeds = @()
foreach ($fa in $findingAids) {
    $out = "seed_calvados_$($fa.Range).sql"
    Write-Host ""
    Write-Host "=== Calvados $($fa.Range)  ($($fa.Id)) ===" -ForegroundColor Cyan

    $cmd = @($fa.Id, "findingaid", "--year-min", $YearMin, "--year-max", $YearMax)
    if ($ReconOnly) {
        python scout_cadastre.py @cmd
    } else {
        python scout_cadastre.py @cmd --run --out $out
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Echec scout pour $($fa.Range) (code $LASTEXITCODE)" -ForegroundColor Yellow
    } elseif (-not $ReconOnly -and (Test-Path $out)) {
        $seeds += $out
    }
}

if (-not $ReconOnly -and $seeds.Count -gt 0) {
    $combined = "seed_calvados.sql"
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("-- Cadastre napoleonien - Calvados (FRAD014) - periode $YearMin-$YearMax")
    foreach ($s in $seeds) {
        [void]$sb.AppendLine("")
        [void]$sb.AppendLine("-- ===== $s =====")
        [void]$sb.AppendLine((Get-Content -Raw -Encoding utf8 $s))
    }
    # UTF-8 SANS BOM (compatible Supabase + accents)
    [System.IO.File]::WriteAllText(
        (Join-Path $PSScriptRoot $combined),
        $sb.ToString(),
        (New-Object System.Text.UTF8Encoding($false))
    )
    Write-Host ""
    Write-Host "-> Seed combine : $combined  ($($seeds.Count) tranche(s))" -ForegroundColor Green
}
