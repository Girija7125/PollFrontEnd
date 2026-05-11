import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PollService } from '../poll-service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  polls: any[] = [];
  pollResults: { [pollId: string]: { results: any[]; totalVoters: number } } = {};
  loading = false;
  expandedPollId: string | null = null;
  searchQuery = '';
  fromDate = '';
  toDate = '';
  statusFilter = '';
  deletingPollId: string | null = null;

  constructor(
    private pollService: PollService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllPolls();
  }

  loadAllPolls(): void {
    this.loading = true;
    this.pollService.getPolls(this.searchQuery, this.fromDate, this.toDate, this.statusFilter).subscribe({
      next: (data) => {
        this.polls = data;
        this.loading = false;
        this.polls.forEach((poll) => this.loadResults(poll._id));
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSearch(): void {
    this.loadAllPolls();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.fromDate = '';
    this.toDate = '';
    this.statusFilter = '';
    this.loadAllPolls();
  }

  loadResults(pollId: string): void {
    this.pollService.getResults(pollId).subscribe({
      next: (data) => {
        this.pollResults[pollId] = { results: data.results, totalVoters: data.totalVoters };
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  deletePoll(pollId: string): void {
    if (!confirm('Delete this poll? It will be hidden from voting but data is preserved.')) return;
    this.deletingPollId = pollId;
    this.pollService.deletePoll(pollId).subscribe({
      next: () => {
        this.polls = this.polls.filter((p) => p._id !== pollId);
        delete this.pollResults[pollId];
        this.deletingPollId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.deletingPollId = null;
        this.cdr.detectChanges();
      },
    });
  }

  toggleExpand(pollId: string): void {
    this.expandedPollId = this.expandedPollId === pollId ? null : pollId;
  }

  getResults(pollId: string): any[] {
    return this.pollResults[pollId]?.results || [];
  }

  getTotalVoters(pollId: string): number {
    return this.pollResults[pollId]?.totalVoters || 0;
  }

  getVoteCount(pollId: string, optionText: string): number {
    return this.getResults(pollId).find((r) => r.option === optionText)?.voteCount || 0;
  }

  getPercentage(pollId: string, optionText: string): number {
    const total = this.getTotalVoters(pollId);
    return total ? Math.round((this.getVoteCount(pollId, optionText) / total) * 100) : 0;
  }

  getTopOption(pollId: string): string {
    const results = this.getResults(pollId);
    return results.length ? results[0].option : 'No votes yet';
  }

  getTotalVotesAcrossAllPolls(): number {
    return this.polls.reduce((sum, poll) => sum + this.getTotalVoters(poll._id), 0);
  }

  getTotalOptions(): number {
    return this.polls.reduce((sum, poll) => sum + poll.options.length, 0);
  }

  getActivePollsCount(): number {
    return this.polls.filter((p) => this.getPollStatus(p) === 'active').length;
  }

  getPollStatus(poll: any): 'deleted' | 'active' | 'inactive' | 'upcoming' {
    if (poll.isDeleted) return 'deleted';
    const now = new Date();
    if (new Date(poll.startDate) > now) return 'upcoming';
    if (new Date(poll.endDate) < now || !poll.isActive) return 'inactive';
    return 'active';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  goToEdit(poll: any): void {
    this.router.navigate(['/polls'], { state: { editPoll: poll } });
  }

  goToVoting(): void {
    this.router.navigate(['/vote']);
  }

  refresh(): void {
    this.pollResults = {};
    this.loadAllPolls();
  }
}