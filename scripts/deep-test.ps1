param([string]$BaseUrl = 'http://127.0.0.1:39999/api')

$ErrorActionPreference = 'Stop'
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-TestApi {
    param([string]$Name, [string]$Method, [string]$Path, $Body = $null, [string]$Token = '', [int[]]$Expected = @(200))
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    try {
        $params = @{ Uri = "$BaseUrl$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 20 }
        if ($null -ne $Body) {
            $params.ContentType = 'application/json'
            $params.Body = $Body | ConvertTo-Json -Depth 8 -Compress
        }
        $response = Invoke-WebRequest @params
        $status = [int]$response.StatusCode
        $json = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
        $json = if ($content) { $content | ConvertFrom-Json } else { $null }
    }
    $passed = $Expected -contains $status
    $results.Add([pscustomobject]@{ name = $Name; status = $status; passed = $passed; message = $json.message })
    if (-not $passed) { throw "$Name expected $($Expected -join '/') got $status" }
    return $json
}

$stamp = Get-Date -Format 'MMddHHmmss'
$username = "e2e_$stamp"
$password = 'E2Etest@123'

Invoke-TestApi 'unauthenticated profile' GET '/user/profile' $null '' @(401) | Out-Null
$registration = Invoke-TestApi 'register whitehat' POST '/register' @{ username = $username; password = $password; nickname = 'E2E Researcher'; email = "$username@example.com" }
$whiteToken = $registration.data.token
$companyToken = (Invoke-TestApi 'company login' POST '/login' @{ username = 'acme'; password = 'Company@123' }).data.token
$adminToken = (Invoke-TestApi 'admin login' POST '/login' @{ username = 'admin'; password = 'Admin@123456' }).data.token
Invoke-TestApi 'wrong password rejected' POST '/login' @{ username = 'acme'; password = 'wrong-password' } '' @(400) | Out-Null

$start = (Get-Date).ToString('yyyy-MM-dd')
$end = (Get-Date).AddDays(10).ToString('yyyy-MM-dd')
$task = Invoke-TestApi 'company creates task' POST '/task/create' @{ title = "E2E Authorized Test $stamp"; type = 'PENETRATION'; description = 'End-to-end workflow test task'; targetAssets = "e2e-$stamp.demo.example.com"; startDate = $start; endDate = $end; rewardAmount = 6600; difficulty = 'INTERMEDIATE'; minSeverity = 'LOW'; memberLimit = 3 } $companyToken
$taskId = [long]$task.data.id
Invoke-TestApi 'admin cannot impersonate company' POST '/task/create' @{ title = 'forbidden'; type = 'CTF'; description = 'forbidden'; targetAssets = 'none'; startDate = $start; endDate = $end; rewardAmount = 0; difficulty = 'BEGINNER'; minSeverity = 'LOW'; memberLimit = 1 } $adminToken @(403) | Out-Null
Invoke-TestApi 'whitehat applies task' POST '/task/apply' @{ taskId = $taskId; message = 'E2E workflow test' } $whiteToken | Out-Null
Invoke-TestApi 'duplicate application rejected' POST '/task/apply' @{ taskId = $taskId; message = 'duplicate' } $whiteToken @(409) | Out-Null

$daily = @{ taskId = $taskId; reportDate = $start; workContent = 'Completed authorization boundary tests'; testTarget = "e2e-$stamp.demo.example.com"; findings = 'Found an access control issue'; riskAnalysis = 'May expose tenant test data'; nextPlan = 'Submit vulnerability and help reproduce' }
Invoke-TestApi 'daily report submitted' POST '/report/daily' $daily $whiteToken | Out-Null
Invoke-TestApi 'duplicate daily rejected' POST '/report/daily' $daily $whiteToken @(409) | Out-Null
$before = (Invoke-TestApi 'profile before reward' GET '/user/profile' $null $whiteToken).data.score
$vulnerability = Invoke-TestApi 'vulnerability submitted' POST '/vulnerability/create' @{ taskId = $taskId; title = "E2E Broken Object Authorization $stamp"; vulnerabilityType = 'BROKEN_ACCESS_CONTROL'; affectedAsset = "https://e2e-$stamp.demo.example.com/api/orders/1"; description = 'Changing an order ID returns another test tenant record'; reproductionSteps = '1 Login 2 Request order 3 Change order ID 4 Observe response'; severity = 'HIGH'; cvssScore = 8.1 } $whiteToken
$vulnerabilityId = [long]$vulnerability.data.id
Invoke-TestApi 'whitehat cannot review vulnerability' PUT "/vulnerability/$vulnerabilityId/review" @{ status = 'CONFIRMED'; reviewComment = 'forbidden'; severity = 'HIGH' } $whiteToken @(403) | Out-Null
$companyVulnerabilities = Invoke-TestApi 'company sees vulnerability' GET '/vulnerability/list' $null $companyToken
if (-not ($companyVulnerabilities.data.id -contains $vulnerabilityId)) { throw 'Company vulnerability list is missing the new report' }
Invoke-TestApi 'company confirms vulnerability' PUT "/vulnerability/$vulnerabilityId/review" @{ status = 'CONFIRMED'; reviewComment = 'E2E reproduction confirmed'; severity = 'HIGH' } $companyToken | Out-Null
$after = (Invoke-TestApi 'profile after reward' GET '/user/profile' $null $whiteToken).data.score
if (($after - $before) -ne 200) { throw "Score delta expected 200 got $($after - $before)" }
Invoke-TestApi 'duplicate review rejected' PUT "/vulnerability/$vulnerabilityId/review" @{ status = 'CONFIRMED'; reviewComment = 'duplicate'; severity = 'HIGH' } $companyToken @(400) | Out-Null
$reports = Invoke-TestApi 'company reads task reports' GET "/report/task/$taskId" $null $companyToken
if ($reports.data.Count -ne 1) { throw "Expected 1 daily report got $($reports.data.Count)" }
Invoke-TestApi 'whitehat cannot read company reports' GET "/report/task/$taskId" $null $whiteToken @(403) | Out-Null
Invoke-TestApi 'admin overview' GET '/admin/overview' $null $adminToken | Out-Null
Invoke-TestApi 'whitehat cannot read admin overview' GET '/admin/overview' $null $whiteToken @(403) | Out-Null

$injection = [uri]::EscapeDataString("' OR 1=1 --")
$search = Invoke-TestApi 'injection-like search is parameterized' GET "/tasks?page=1&size=20&keyword=$injection"
if ($search.data.total -ne 0) { throw "Injection-like search unexpectedly returned $($search.data.total) rows" }
Invoke-TestApi 'invalid task date rejected' POST '/task/create' @{ title = 'bad dates'; type = 'CTF'; description = 'bad date validation'; targetAssets = 'none'; startDate = $end; endDate = $start; rewardAmount = 0; difficulty = 'BEGINNER'; minSeverity = 'LOW'; memberLimit = 1 } $companyToken @(400) | Out-Null
Invoke-TestApi 'invalid task enum rejected' POST '/task/create' @{ title = 'bad enum'; type = 'UNSUPPORTED'; description = 'enum validation'; targetAssets = 'none'; startDate = $start; endDate = $end; rewardAmount = 0; difficulty = 'INVALID'; minSeverity = 'UNKNOWN'; memberLimit = 1 } $companyToken @(400) | Out-Null
Invoke-TestApi 'invalid registration rejected' POST '/register' @{ username = 'x'; password = 'short'; nickname = 'bad'; email = 'bad-email' } '' @(400) | Out-Null

[pscustomobject]@{
    user = $username; taskId = $taskId; vulnerabilityId = $vulnerabilityId
    scoreBefore = $before; scoreAfter = $after; checks = $results.Count
    passed = ($results | Where-Object passed).Count
    failed = ($results | Where-Object { -not $_.passed }).Count
    results = $results
} | ConvertTo-Json -Depth 8
