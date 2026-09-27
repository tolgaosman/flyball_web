<?php

namespace Tests\Feature;

use App\Flyball\Model\AnswerResult;
use App\Flyball\Model\Board;
use App\Flyball\Model\Factor;
use App\Flyball\Model\FactorType;
use App\Flyball\Model\Round;
use App\Flyball\Model\RoundKind;
use App\Services\AiCacheStore;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AiCacheStoreTest extends TestCase
{
    use RefreshDatabase;

    private AiCacheStore $store;

    protected function setUp(): void
    {
        parent::setUp();
        $this->store = new AiCacheStore;
    }

    public function test_two_team_key_ignores_order_but_team_country_does_not(): void
    {
        $this->assertSame(AiCacheStore::keyFor(RoundKind::TwoTeam, 'Real Madrid', 'Arsenal'), AiCacheStore::keyFor(RoundKind::TwoTeam, 'Arsenal', 'Real Madrid'));
        $this->assertSame('twoTeam:Arsenal::Real Madrid', AiCacheStore::keyFor(RoundKind::TwoTeam, 'Real Madrid', 'Arsenal'));
        $this->assertNotSame(AiCacheStore::keyFor(RoundKind::TeamCountry, 'Arsenal', 'France'), AiCacheStore::keyFor(RoundKind::TeamCountry, 'France', 'Arsenal'));
    }

    public function test_answer_round_trip_keeps_the_verified_flag(): void
    {
        $this->assertNull($this->store->getAnswer('missing'));
        $this->store->putAnswer('k', 'A', 'B', new AnswerResult(['Mesut Özil'], false));
        $got = $this->store->getAnswer('k');
        $this->assertSame(['Mesut Özil'], $got->players);
        $this->assertFalse($got->verified);
    }

    public function test_put_overwrites_instead_of_duplicating(): void
    {
        $this->store->putAnswer('k', 'A', 'B', new AnswerResult(['One'], true));
        $this->store->putAnswer('k', 'A', 'B', new AnswerResult(['Two'], true));
        $this->assertSame(['Two'], $this->store->getAnswer('k')->players);
    }

    public function test_ttl_is_two_days_in_transfer_windows_and_seven_otherwise(): void
    {
        $day = 86_400_000;
        $this->assertSame(2 * $day, AiCacheStore::ttlMsFor(Carbon::parse('2026-01-15')));
        $this->assertSame(2 * $day, AiCacheStore::ttlMsFor(Carbon::parse('2026-08-15')));
        $this->assertSame(7 * $day, AiCacheStore::ttlMsFor(Carbon::parse('2026-11-15')));
    }

    public function test_expired_answers_are_a_miss(): void
    {
        Carbon::setTestNow('2026-11-01 12:00:00');
        $this->store->putAnswer('k', 'A', 'B', new AnswerResult(['X'], true));
        Carbon::setTestNow('2026-11-08 11:00:00');
        $this->assertNotNull($this->store->getAnswer('k'));
        Carbon::setTestNow('2026-11-08 13:00:00');
        $this->assertNull($this->store->getAnswer('k'));
        Carbon::setTestNow();
    }

    public function test_board_buffer_is_fifo(): void
    {
        $this->store->pushBoard($this->board('first'));
        $this->store->pushBoard($this->board('second'));
        $this->assertSame(2, $this->store->bufferedBoardCount());
        $this->assertSame('first', $this->store->takeBufferedBoard()->cellExamples[0][0]);
        $this->assertSame(1, $this->store->bufferedBoardCount());
        $this->assertSame('second', $this->store->takeBufferedBoard()->cellExamples[0][0]);
        $this->assertNull($this->store->takeBufferedBoard());
    }

    public function test_round_buffers_are_separated_by_kind(): void
    {
        $this->store->pushRound(new Round(RoundKind::TwoTeam, 'Arsenal', 'Chelsea', new AnswerResult(['X'], true)));
        $this->assertSame(1, $this->store->bufferedRoundCount(RoundKind::TwoTeam));
        $this->assertSame(0, $this->store->bufferedRoundCount(RoundKind::TeamCountry));
        $this->assertNull($this->store->takeBufferedRound(RoundKind::TeamCountry));
        $this->assertSame('Chelsea', $this->store->takeBufferedRound(RoundKind::TwoTeam)->conditionB);
    }

    private function board(string $marker): Board
    {
        $f = fn (string $v) => new Factor(FactorType::Team, "Played for {$v}", $v);

        return new Board([$f('A'), $f('B'), $f('C')], [$f('D'), $f('E'), $f('F')], array_fill(0, 9, [$marker]));
    }
}
