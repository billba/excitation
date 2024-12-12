import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Template } from "./Template";
import { Citation } from "./Citation";

@Entity({
    name: 'question',
    schema: 'dbo'
})
export class Question {
    @PrimaryGeneratedColumn()
    question_id!: number;

    @ManyToOne((type) => Template)
    @JoinColumn({ name: 'template_id' })
    template: Template;

    @RelationId((question: Question) => question.template)
    @Column({ type: 'int', nullable: true })
    template_id: number;

    @Column({ type: 'varchar', nullable: true })
    prefix: string;

    @Column('text')
    text!: string;

    @Column('text')
    creator: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;

    @OneToMany(() => Citation, citation => citation.question)
    citations!: Citation[];

    @RelationId((question: Question) => question.citations)
    citationIds!: string[];
}