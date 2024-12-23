import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Template } from "./Template";
import { Document } from "./Document";
import { Citation } from "./Citation";
import { Answer } from "./Answer";

@Entity({
    name: 'form',
    schema: 'dbo'
})
export class Form {
    @PrimaryGeneratedColumn()
    formId!: number;

    @ManyToOne((type) => Template)
    @JoinColumn({ name: 'templateId' })
    template: Template;

    @RelationId((form: Form) => form.template)
    @Column({ type: 'int', nullable: true })
    templateId: number;

    @Column({ type: 'varchar', length: 255 })
    formName!: string;

    @Column({ type: 'varchar', length: 255 })
    creator!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @OneToMany(() => Document, document => document.form)
    documents!: Document[];

    @RelationId((form: Form) => form.documents)
    documentIds!: number[];

    @OneToMany(() => Citation, citation => citation.form)
    citations!: Citation[];

    @RelationId((form: Form) => form.citations)
    citationIds!: string[];

    @OneToMany(() => Answer, answer => answer.form)
    answers!: Answer[];

    @RelationId((form: Form) => form.answers)
    answerIds!: string[];
}
