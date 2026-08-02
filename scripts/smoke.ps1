$ErrorActionPreference = "Stop"
$baseUrl = if ($env:API_BASE_URL) { $env:API_BASE_URL.TrimEnd("/") } else { "http://localhost:3001/api/v1" }
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
  email = "student@exam.local"
  password = "Practice123!"
} | ConvertTo-Json) -WebSession $webSession
$health = Invoke-RestMethod -Uri "$baseUrl/health/ready"
if ($health.status -ne "ready" -or !$health.dependencies.email) { throw "Database, Redis, or SMTP readiness failed." }
Invoke-RestMethod -Uri "$baseUrl/auth/password-reset/request" -Method Post -ContentType "application/json" -Body (@{
  email = "student@exam.local"
} | ConvertTo-Json) | Out-Null

$exams = Invoke-RestMethod -Uri "$baseUrl/exams" -WebSession $webSession
$form = ($exams | Where-Object code -eq "IELTS_AC").testForms | Where-Object slug -eq "ielts-academic-diagnostic-1"
$started = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -ContentType "application/json" -Body (@{
  testFormId = $form.id
} | ConvertTo-Json) -WebSession $webSession

$question = $started.form.sections[0].section.questions[0]
Invoke-RestMethod -Uri "$baseUrl/sessions/$($started.id)/answers/$($question.id)" -Method Patch -ContentType "application/json" -Body (@{
  response = @{ value = "B" }
} | ConvertTo-Json -Depth 3) -WebSession $webSession | Out-Null
Invoke-RestMethod -Uri "$baseUrl/sessions/$($started.id)/integrity" -Method Post -ContentType "application/json" -Body (@{
  type = "question_unclear"
  detail = @{ questionId = $question.id }
} | ConvertTo-Json -Depth 3) -WebSession $webSession | Out-Null

$submitted = Invoke-RestMethod -Uri "$baseUrl/sessions/$($started.id)/submit" -Method Post -WebSession $webSession
$review = Invoke-RestMethod -Uri "$baseUrl/sessions/$($started.id)/score" -WebSession $webSession

if ($submitted.status -ne "SCORED") { throw "Expected SCORED, received $($submitted.status)" }
if ($review.answers.Count -lt 1 -or $review.scores.Count -lt 1) { throw "Review response was incomplete." }

$completeForm = ($exams | Where-Object code -eq "IELTS_AC").testForms | Where-Object slug -eq "ielts-academic-complete-1"
$mediaSession = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -ContentType "application/json" -Body (@{
  testFormId = $completeForm.id
} | ConvertTo-Json) -WebSession $webSession
$audio = $mediaSession.form.sections.section.audioAssets | Select-Object -First 1
$mediaResponse = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/media/sessions/$($mediaSession.id)/audio/$($audio.id)" -WebSession $webSession
if ($mediaResponse.RawContentLength -lt 100) { throw "Protected listening media did not stream." }

$toeflForm = ($exams | Where-Object code -eq "TOEFL").testForms | Where-Object slug -eq "toefl-current-2026-1"
$toefl = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -ContentType "application/json" -Body (@{ testFormId = $toeflForm.id } | ConvertTo-Json) -WebSession $webSession
$toeflReading = $toefl.form.sections | Where-Object { $_.section.id -eq $toefl.activeSectionId }
$toeflAnswers = @(@{ value = "viable" }, @{ value = "C" }, @{ value = @("A", "D") })
for ($index = 0; $index -lt $toeflReading.section.questions.Count; $index++) {
  $questionId = $toeflReading.section.questions[$index].id
  Invoke-RestMethod -Uri "$baseUrl/sessions/$($toefl.id)/answers/$questionId" -Method Patch -ContentType "application/json" -Body (@{ response = $toeflAnswers[$index] } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
}
Invoke-RestMethod -Uri "$baseUrl/sessions/$($toefl.id)/submit" -Method Post -WebSession $webSession | Out-Null
$toeflReview = Invoke-RestMethod -Uri "$baseUrl/sessions/$($toefl.id)/score" -WebSession $webSession
$toeflReadingScore = $toeflReview.scores | Where-Object skill -eq "READING"
if ([double]$toeflReadingScore.band -ne 6 -or [double]$toeflReadingScore.scaledScore -ne 30) { throw "Current TOEFL dual-scale scoring failed." }

$greForm = ($exams | Where-Object code -eq "GRE").testForms | Where-Object slug -eq "gre-current-1"
$gre = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -ContentType "application/json" -Body (@{
  testFormId = $greForm.id
} | ConvertTo-Json) -WebSession $webSession
$writing = $gre.form.sections | Where-Object { $_.section.id -eq $gre.activeSectionId }
$writingQuestion = $writing.section.questions[0]
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/answers/$($writingQuestion.id)" -Method Patch -ContentType "application/json" -Body (@{ response = @{ text = "Public institutions shape trust and opportunity. A society should measure their quality carefully while also considering health, knowledge, and individual freedom." } } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/sections/$($writing.section.id)/submit" -Method Post -WebSession $webSession | Out-Null
$greState = Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)" -WebSession $webSession
$verbal = $greState.form.sections | Where-Object { $_.section.id -eq $greState.activeSectionId }
$verbalAnswers = @(@{ value = "B" }, @{ value = @("A", "C") })
for ($index = 0; $index -lt $verbal.section.questions.Count; $index++) {
  $questionId = $verbal.section.questions[$index].id
  Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/answers/$questionId" -Method Patch -ContentType "application/json" -Body (@{
    response = $verbalAnswers[$index]
  } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
}
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/sections/$($verbal.section.id)/submit" -Method Post -WebSession $webSession | Out-Null
$greState = Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)" -WebSession $webSession
$verbalRoute = $greState.form.sections | Where-Object { $_.section.id -eq $greState.activeSectionId }
if ($verbalRoute.section.name -notlike "*Advanced*") { throw "GRE verbal routing selected '$($verbalRoute.section.name)' instead of the advanced route." }
$verbalRouteQuestion = $verbalRoute.section.questions[0]
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/answers/$($verbalRouteQuestion.id)" -Method Patch -ContentType "application/json" -Body (@{ response = @{ value = "C" } } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/sections/$($verbalRoute.section.id)/submit" -Method Post -WebSession $webSession | Out-Null
$greState = Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)" -WebSession $webSession
$quant = $greState.form.sections | Where-Object { $_.section.id -eq $greState.activeSectionId }
$quantAnswers = @(@{ value = 6 }, @{ value = "A" })
for ($index = 0; $index -lt $quant.section.questions.Count; $index++) {
  $questionId = $quant.section.questions[$index].id
  Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/answers/$questionId" -Method Patch -ContentType "application/json" -Body (@{
    response = $quantAnswers[$index]
  } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
}
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/sections/$($quant.section.id)/submit" -Method Post -WebSession $webSession | Out-Null
$routed = Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)" -WebSession $webSession
$routeName = ($routed.form.sections | Where-Object { $_.section.id -eq $routed.activeSectionId }).section.name
if ($routeName -notlike "Quantitative*Advanced*") { throw "GRE quantitative routing selected '$routeName' instead of the advanced route." }
$quantRoute = $routed.form.sections | Where-Object { $_.section.id -eq $routed.activeSectionId }
$quantRouteQuestion = $quantRoute.section.questions[0]
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/answers/$($quantRouteQuestion.id)" -Method Patch -ContentType "application/json" -Body (@{ response = @{ value = 3 } } | ConvertTo-Json -Depth 4) -WebSession $webSession | Out-Null
Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/sections/$($quantRoute.section.id)/submit" -Method Post -WebSession $webSession | Out-Null
$greReview = Invoke-RestMethod -Uri "$baseUrl/sessions/$($gre.id)/score" -WebSession $webSession
$greObjective = $greReview.scores | Where-Object { $_.skill -in @("VERBAL", "QUANT") }
if (($greObjective | Where-Object { [double]$_.scaledScore -ne 170 }).Count -gt 0 -or $greObjective.Count -ne 2) { throw "GRE practice scaled scoring failed." }

$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body (@{
  email = "admin@exam.local"
  password = "Practice123!"
} | ConvertTo-Json) -WebSession $adminSession | Out-Null
$analytics = Invoke-RestMethod -Uri "$baseUrl/admin/analytics/questions" -WebSession $adminSession
$flags = Invoke-RestMethod -Uri "$baseUrl/admin/feature-flags" -WebSession $adminSession
if ($null -eq $analytics.items -or $flags.Count -lt 2) { throw "Admin analytics or feature flags were unavailable." }
$reportedItem = $analytics.items | Where-Object id -eq $question.id
if ($reportedItem.flaggedAsUnclear -lt 1) { throw "Unclear-question reporting did not reach item analytics." }

[pscustomobject]@{
  login = $login.user.email
  session = $started.id
  status = $submitted.status
  scores = $review.scores.Count
  answers = $review.answers.Count
  protectedMediaBytes = $mediaResponse.RawContentLength
  greRoute = $routeName
  featureFlags = $flags.Count
  unclearReports = $reportedItem.flaggedAsUnclear
  smtp = $health.dependencies.email
  toeflBand = $toeflReadingScore.band
  greScaled = ($greObjective | Select-Object -ExpandProperty scaledScore)
} | ConvertTo-Json -Compress
