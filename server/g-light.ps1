param([ValidateSet('red','green','blue','off')][string]$Effect,[ValidatePattern('^COM[1-9][0-9]*$')][string]$Port='COM3',[ValidateRange(0,10000)][int]$TransitionMs=200)
$ErrorActionPreference='Stop'
$seq=[uint32]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -band 2147483647)
$bytes=[System.Collections.Generic.List[byte]]::new()
$bytes.AddRange([Text.Encoding]::ASCII.GetBytes('BPR1'))
$bytes.AddRange([BitConverter]::GetBytes($seq))
$bytes.AddRange([BitConverter]::GetBytes([uint16]$TransitionMs))
$rgb=@(0,0,0)
if($Effect -eq 'red'){$rgb[0]=32768}
if($Effect -eq 'green'){$rgb[1]=32768}
if($Effect -eq 'blue'){$rgb[2]=32768}
for($i=0;$i -lt 3;$i++){foreach($v in $rgb){$bytes.AddRange([BitConverter]::GetBytes([uint16]$v))}}
$crc=65535
foreach($b in $bytes){$crc=$crc -bxor ([int]$b -shl 8);for($j=0;$j -lt 8;$j++){if($crc -band 32768){$crc=(($crc -shl 1) -bxor 4129) -band 65535}else{$crc=($crc -shl 1) -band 65535}}}
$bytes.AddRange([BitConverter]::GetBytes([uint16]$crc))
$expected=@();for($i=0;$i -lt 3;$i++){foreach($v in $rgb){$expected+=[int][Math]::Round([Math]::Pow($v/65535,2.2)*65535)}}
$serial=[IO.Ports.SerialPort]::new($Port,115200,[IO.Ports.Parity]::None,8,[IO.Ports.StopBits]::One)
$serial.DtrEnable=$false;$serial.RtsEnable=$false;$serial.ReadTimeout=1200;$serial.WriteTimeout=2000
try{
 $serial.Open();$deadline=[DateTime]::UtcNow.AddSeconds(8);$ready=$false
 while([DateTime]::UtcNow -lt $deadline){try{if($serial.ReadLine().StartsWith('BPR1 STATUS ')){$ready=$true;break}}catch [TimeoutException]{}}
 if(!$ready){throw 'No BPR1 status; no command sent'}
 $packet=$bytes.ToArray();$serial.Write($packet,0,$packet.Length)
 $deadline=[DateTime]::UtcNow.AddSeconds(6)
 while([DateTime]::UtcNow -lt $deadline){
  try{$line=$serial.ReadLine()}catch [TimeoutException]{continue}
  if($line -match "BPR1 STATUS seq=$seq .*duty=([0-9,]+)"){
   $actual=$Matches[1].Split(',');$ok=$actual.Length -eq 9
   for($i=0;$ok -and $i -lt 9;$i++){if([Math]::Abs([int]$actual[$i]-$expected[$i]) -gt 2){$ok=$false}}
   if($ok){Write-Output "confirmed $Effect $Port $line";exit 0}
  }
 }
 throw 'Sent but target PWM was not confirmed'
}finally{if($serial.IsOpen){$serial.Close()};$serial.Dispose()}
